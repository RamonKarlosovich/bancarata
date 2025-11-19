import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BANCARATA – Global Financial Trust",
  description: "Sistema bancario distribuido para pagos integrados entre comercios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}