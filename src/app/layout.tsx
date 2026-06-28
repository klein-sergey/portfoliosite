import type { Metadata } from "next";
import { Barlow_Condensed, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const uiFont = Barlow_Condensed({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    <html lang="ru" className={`${uiFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
