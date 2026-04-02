import { createEffect, createRoot, createSignal } from "solid-js";

export type Theme = "light";

function createThemeStore() {
  const [theme, setTheme] = createSignal<Theme>("light");

  const resolvedTheme = () => "light" as const;

  createEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  });

  const cycleTheme = () => {
    setTheme("light");
  };

  return {
    cycleTheme,
    resolvedTheme,
    setTheme,
    theme,
  };
}

export const themeStore = createRoot(createThemeStore);
