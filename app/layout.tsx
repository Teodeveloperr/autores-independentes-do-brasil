import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Autores Independentes do Brasil",
    template: "%s · Autores Independentes do Brasil",
  },
  description:
    "Coletivo de escritores independentes do Brasil — perfis de autores, livros à venda, eventos e blog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
