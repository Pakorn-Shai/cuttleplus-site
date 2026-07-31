import type { PublicTheme } from "@/core/themes/contracts";
import { defaultTheme } from "./default/theme";
import { minimalTheme } from "./minimal/theme";

const themes = new Map<string, PublicTheme>([
  [defaultTheme.manifest.id, defaultTheme],
  [minimalTheme.manifest.id, minimalTheme],
]);

export function getTheme(id = "default"): PublicTheme {
  return themes.get(id) ?? defaultTheme;
}

export function listThemes(): PublicTheme[] {
  return [...themes.values()];
}
