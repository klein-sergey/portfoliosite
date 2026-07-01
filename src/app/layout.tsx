import type { Metadata, Viewport } from "next";
import { Russo_One } from "next/font/google";
import "./globals.css";

const uiFont = Russo_One({
  variable: "--font-ui",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Sergey Klein",
  description: "Портфолио документальных работ Sergey Klein в VHS-интерфейсе.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
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
