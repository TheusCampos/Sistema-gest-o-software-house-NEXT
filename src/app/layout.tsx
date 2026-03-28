import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

// Metadados base do Next.js (título/descrição usados por SEO e pelo navegador)
export const metadata: Metadata = {
  title: "Zeus Enterprise Manager",
  description: "Enterprise Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100`}
        suppressHydrationWarning
      >
        {/* Provider global: centraliza estado compartilhado (usuário, dados e UI como tema/sidebar) */}
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
