const gate = document.getElementById("gate");
const site = document.getElementById("site");
const themeToggle = document.querySelector(".theme-toggle");
const redecide = document.querySelector(".redecide");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const THEME_KEY = "suman-theme";
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function themeColor(theme) {
  return theme === "light" ? "#f4f1ea" : "#0b0b0b";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  if (themeMeta) themeMeta.setAttribute("content", themeColor(theme));
}

function showSite() {
  document.body.classList.remove("gate-open");
  site.hidden = false;
  gate.classList.add("is-gone");
  window.setTimeout(() => {
    gate.setAttribute("hidden", "");
    const heading = document.querySelector(".intro__name");
    if (heading) heading.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, REDUCE_MOTION ? 0 : 520);
}

function chooseTheme(theme) {
  if (gate.classList.contains("is-locked")) return;

  applyTheme(theme);
  gate.classList.add("is-locked", `is-choosing-${theme}`);
  gate.setAttribute("aria-hidden", "true");
  gate.inert = true;

  const delay = REDUCE_MOTION ? 0 : 1050;
  window.setTimeout(showSite, delay);
}

function returnToGate() {
  gate.removeAttribute("hidden");
  gate.removeAttribute("aria-hidden");
  gate.inert = false;
  gate.classList.remove("is-gone", "is-locked", "is-choosing-dark", "is-choosing-light");
  site.hidden = true;
  document.body.classList.add("gate-open");
  window.scrollTo(0, 0);
  const firstChoice = gate.querySelector(".gate__choice");
  firstChoice?.focus();
}

gate.querySelectorAll(".gate__choice").forEach((button) => {
  button.addEventListener("click", () => chooseTheme(button.dataset.theme));
});

themeToggle?.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

redecide?.addEventListener("click", returnToGate);

document.addEventListener("keydown", (event) => {
  if (site.hidden === false) return;
  if (event.key === "ArrowLeft") chooseTheme("dark");
  if (event.key === "ArrowRight") chooseTheme("light");
});
