const THEME_KEY = "suman-theme";
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // A blocked storage quota should not break the toggle.
  }
  if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0b0b0b" : "#f4f1ea");
}

applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

themeToggle?.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});
