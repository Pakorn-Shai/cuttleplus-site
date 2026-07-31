import { getMenuItems } from "@/lib/menu";
import { getThemeSettings } from "@/lib/theme-settings";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const [menuItems, theme] = await Promise.all([getMenuItems(), getThemeSettings()]);

  return <NavbarClient menuItems={menuItems} theme={theme} />;
}
