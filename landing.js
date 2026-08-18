const doors = document.querySelector(".doors");
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The sections used to live at the root, so old links still point here.
const MOVED_SECTIONS = ["#intro", "#about", "#craft", "#timeline", "#contact", "#chill"];

if (MOVED_SECTIONS.includes(window.location.hash)) {
  window.location.replace(`personal/${window.location.hash}`);
}

function leave(door) {
  doors.classList.add("is-leaving", `is-leaving-${door.dataset.door}`);
  window.setTimeout(() => {
    window.location.href = door.href;
  }, 620);
}

doors.querySelectorAll(".door").forEach((door) => {
  door.addEventListener("click", (event) => {
    if (REDUCE_MOTION || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    leave(door);
  });
});

document.addEventListener("keydown", (event) => {
  if (doors.classList.contains("is-leaving")) return;
  const key = event.key;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return;
  const door = doors.querySelector(key === "ArrowLeft" ? ".door--work" : ".door--person");
  if (REDUCE_MOTION) window.location.href = door.href;
  else leave(door);
});
