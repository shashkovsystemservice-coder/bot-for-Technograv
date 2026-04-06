import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Technograv Bot Admin",
  description: "Управление опросами и аналитика",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}