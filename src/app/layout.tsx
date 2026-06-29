import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";

const uiFont = Barlow_Condensed({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sergey Klein",
  description: "Портфолио документальных работ Sergey Klein в VHS-интерфейсе.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={uiFont.variable}>
      <body>{children}</body>
    </html>
  );
}
