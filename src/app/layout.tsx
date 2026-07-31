import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Knowledge Hub", template: "%s · Knowledge Hub" },
  description: "คลังความรู้ส่วนตัวที่เขียนง่าย อ่านสบาย และค้นพบสิ่งที่เคยเรียนรู้ได้เสมอ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
