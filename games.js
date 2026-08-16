const chillPicks = document.querySelectorAll(".chill-pick");
const chillStage = document.querySelector(".chill-stage");
const chillBoard = document.querySelector(".chill-board");
const chillStatus = document.querySelector(".chill-status");
const chillReset = document.querySelector(".chill-reset");
const chillClose = document.querySelector(".chill-close");

let activeGame = null;
let stopActive = () => {};

function colors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    bg: styles.getPropertyValue("--bg-elevated").trim() || "#141414",
    page: styles.getPropertyValue("--bg").trim() || "#0b0b0b",
    text: styles.getPropertyValue("--text").trim() || "#f3eee6",
    muted: styles.getPropertyValue("--muted").trim() || "#a39c91",
    line: styles.getPropertyValue("--line").trim() || "#2a2a2a",
    accent: styles.getPropertyValue("--accent").trim() || "#d4a574",
  };
}

function setStatus(text) {
  if (chillStatus) chillStatus.textContent = text;
}

function openStage(game) {
  stopActive();
  activeGame = game;
  chillStage.hidden = false;
  chillBoard.replaceChildren();
  chillStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeStage() {
  stopActive();
  activeGame = null;
  chillStage.hidden = true;
  chillBoard.replaceChildren();
  setStatus("");
}

chillPicks.forEach((button) => {
  button.addEventListener("click", () => {
    const game = button.dataset.game;
    openStage(game);
    if (game === "dxball") stopActive = startDxBall(chillBoard);
    if (game === "mines") stopActive = startMines(chillBoard);
  });
});

chillReset?.addEventListener("click", () => {
  if (!activeGame) return;
  stopActive();
  chillBoard.replaceChildren();
  if (activeGame === "dxball") stopActive = startDxBall(chillBoard);
  if (activeGame === "mines") stopActive = startMines(chillBoard);
});

chillClose?.addEventListener("click", closeStage);

function startDxBall(root) {
  const canvas = document.createElement("canvas");
  canvas.className = "dx-canvas";
  canvas.setAttribute("tabindex", "0");
  canvas.setAttribute("aria-label", "DX-Ball. Move the paddle with the mouse, a finger, or the arrow keys.");
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let running = true;
  let won = false;
  let lost = false;
  let lives = 3;
  let score = 0;
  let raf = 0;
  let paddleX = 0;
  let ball = { x: 0, y: 0, vx: 0, vy: 0, r: 6 };
  let bricks = [];
  const keys = { left: false, right: false };

  function layout() {
    const max = Math.min(root.clientWidth || 560, 560);
    width = max;
    height = Math.round(max * 0.72);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeBricks() {
    const cols = 8;
    const rows = 5;
    const gap = 6;
    const inset = 16;
    const brickW = (width - inset * 2 - gap * (cols - 1)) / cols;
    const brickH = 16;
    bricks = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        bricks.push({
          x: inset + col * (brickW + gap),
          y: 36 + row * (brickH + gap),
          w: brickW,
          h: brickH,
          live: true,
          row,
        });
      }
    }
  }

  function serve() {
    const paddleW = Math.max(64, width * 0.18);
    paddleX = (width - paddleW) / 2;
    ball.x = width / 2;
    ball.y = height - 48;
    ball.r = Math.max(5, width * 0.012);
    const dir = Math.random() > 0.5 ? 1 : -1;
    ball.vx = dir * (width * 0.22);
    ball.vy = -(height * 0.38);
  }

  function paddle() {
    const w = Math.max(64, width * 0.18);
    return { x: paddleX, y: height - 22, w, h: 9 };
  }

  function movePaddle(x) {
    const p = paddle();
    paddleX = Math.max(8, Math.min(width - p.w - 8, x - p.w / 2));
  }

  function hitBrick(brick) {
    return (
      ball.x + ball.r > brick.x &&
      ball.x - ball.r < brick.x + brick.w &&
      ball.y + ball.r > brick.y &&
      ball.y - ball.r < brick.y + brick.h
    );
  }

  let last = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;

    const p = paddle();
    const speed = width * 0.9;
    if (keys.left) paddleX -= speed * dt;
    if (keys.right) paddleX += speed * dt;
    paddleX = Math.max(8, Math.min(width - p.w - 8, paddleX));

    if (!won && !lost) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x < ball.r + 8) {
        ball.x = ball.r + 8;
        ball.vx *= -1;
      }
      if (ball.x > width - ball.r - 8) {
        ball.x = width - ball.r - 8;
        ball.vx *= -1;
      }
      if (ball.y < ball.r + 8) {
        ball.y = ball.r + 8;
        ball.vy *= -1;
      }

      const pad = paddle();
      if (
        ball.vy > 0 &&
        ball.y + ball.r >= pad.y &&
        ball.y - ball.r <= pad.y + pad.h &&
        ball.x >= pad.x - ball.r &&
        ball.x <= pad.x + pad.w + ball.r
      ) {
        const hit = (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2);
        ball.vx = hit * (width * 0.34);
        ball.vy = -Math.abs(ball.vy);
        ball.y = pad.y - ball.r - 0.5;
      }

      bricks.forEach((brick) => {
        if (!brick.live || !hitBrick(brick)) return;
        brick.live = false;
        score += 10;
        ball.vy *= -1;
      });

      if (bricks.every((brick) => !brick.live)) {
        won = true;
        setStatus("Clear. The bricks never stood a chance.");
      }

      if (ball.y > height + 20) {
        lives -= 1;
        if (lives <= 0) {
          lost = true;
          setStatus("Out. The bricks will remember this.");
        } else {
          serve();
          setStatus(`Lives ${lives} · ${score}`);
        }
      } else if (!won) {
        setStatus(`Lives ${lives} · ${score}`);
      }
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    const c = colors();
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = c.line;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    bricks.forEach((brick) => {
      if (!brick.live) return;
      const fade = 0.45 + brick.row * 0.11;
      ctx.globalAlpha = Math.min(1, fade);
      ctx.fillStyle = c.accent;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.globalAlpha = 1;
    });

    const pad = paddle();
    ctx.fillStyle = c.text;
    roundRect(ctx, pad.x, pad.y, pad.w, pad.h, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = c.text;
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    movePaddle(((event.clientX - rect.left) / rect.width) * width);
  }

  function onKey(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      keys.left = event.type === "keydown";
      event.preventDefault();
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      keys.right = event.type === "keydown";
      event.preventDefault();
    }
  }

  layout();
  makeBricks();
  serve();
  setStatus(`Lives ${lives} · ${score}`);
  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  raf = requestAnimationFrame(frame);
  canvas.focus({ preventScroll: true });

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("pointermove", onPointer);
    canvas.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
  };
}

function startMines(root) {
  const SIZE = 9;
  const MINES = 10;
  const field = [];
  let started = false;
  let over = false;
  let flags = 0;
  let pressTimer = 0;

  const wrap = document.createElement("div");
  wrap.className = "minefield";
  wrap.style.setProperty("--size", String(SIZE));
  root.appendChild(wrap);

  for (let i = 0; i < SIZE * SIZE; i += 1) {
    field.push({ mine: false, open: false, flag: false, n: 0 });
  }

  function neighbors(index) {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    const list = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
        list.push(ny * SIZE + nx);
      }
    }
    return list;
  }

  function plant(safeIndex) {
    let planted = 0;
    while (planted < MINES) {
      const spot = Math.floor(Math.random() * field.length);
      if (spot === safeIndex || field[spot].mine) continue;
      if (neighbors(safeIndex).includes(spot)) continue;
      field[spot].mine = true;
      planted += 1;
    }
    field.forEach((cell, index) => {
      cell.n = neighbors(index).reduce((sum, n) => sum + (field[n].mine ? 1 : 0), 0);
    });
  }

  function remaining() {
    return field.filter((cell) => !cell.mine && !cell.open).length;
  }

  function updateStatus() {
    if (over) return;
    setStatus(`${MINES - flags} mines to respect`);
  }

  function win() {
    over = true;
    field.forEach((cell) => {
      if (cell.mine) cell.flag = true;
    });
    paint();
    setStatus("Clear. You may go back to pretending you work now.");
  }

  function lose(hit) {
    over = true;
    field[hit].open = true;
    field.forEach((cell) => {
      if (cell.mine) cell.open = true;
    });
    paint();
    setStatus("Boom. At least it was only a game.");
  }

  function reveal(index) {
    if (over) return;
    const cell = field[index];
    if (cell.open || cell.flag) return;
    if (!started) {
      plant(index);
      started = true;
    }
    if (cell.mine) {
      lose(index);
      return;
    }
    const stack = [index];
    while (stack.length) {
      const current = stack.pop();
      const here = field[current];
      if (here.open || here.flag) continue;
      here.open = true;
      if (here.n === 0) neighbors(current).forEach((n) => stack.push(n));
    }
    if (remaining() === 0) win();
    else {
      paint();
      updateStatus();
    }
  }

  function toggleFlag(index) {
    if (over) return;
    const cell = field[index];
    if (cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    paint();
    updateStatus();
  }

  function paint() {
    wrap.replaceChildren();
    field.forEach((cell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mine-cell";
      if (cell.open) button.classList.add("is-open");
      if (cell.flag && !cell.open) button.classList.add("is-flag");
      if (cell.open && cell.mine) button.classList.add("is-mine");
      if (cell.open && !cell.mine && cell.n) {
        button.textContent = String(cell.n);
        button.dataset.n = String(cell.n);
      }
      if (cell.flag && !cell.open) button.textContent = "▸";
      if (cell.open && cell.mine) button.textContent = "✸";
      button.setAttribute("aria-label", cell.open ? `Opened ${cell.n || "empty"}` : "Hidden square");

      button.addEventListener("click", () => reveal(index));
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(index);
      });
      button.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") return;
        pressTimer = window.setTimeout(() => {
          toggleFlag(index);
          pressTimer = 0;
        }, 420);
      });
      const cancelPress = () => {
        if (pressTimer) window.clearTimeout(pressTimer);
        pressTimer = 0;
      };
      button.addEventListener("pointerup", cancelPress);
      button.addEventListener("pointerleave", cancelPress);
      wrap.appendChild(button);
    });
  }

  paint();
  updateStatus();

  return () => {
    if (pressTimer) window.clearTimeout(pressTimer);
  };
}