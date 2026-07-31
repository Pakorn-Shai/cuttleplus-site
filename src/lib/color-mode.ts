export type ColorMode = "light" | "dark";

export const COLOR_MODE_EVENT = "kh-color-mode-change";

export function getPreferredColorMode(): ColorMode {
  const saved = window.localStorage.getItem("kh-color-mode");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyColorMode(mode: ColorMode, persist = true) {
  document.querySelector(".public-theme")?.classList.toggle("dark", mode === "dark");
  if (persist) window.localStorage.setItem("kh-color-mode", mode);
  window.dispatchEvent(new CustomEvent<ColorMode>(COLOR_MODE_EVENT, { detail: mode }));
}
