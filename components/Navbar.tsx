import { getMenuItems } from "@/lib/menu";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const menuItems = await getMenuItems();

  return <NavbarClient menuItems={menuItems} />;
}
