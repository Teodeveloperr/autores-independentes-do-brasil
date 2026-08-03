import type { Metadata, Viewport } from "next";
import { Cinzel, Roboto } from "next/font/google";
import { CartProvider } from "@/components/CartContext";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
    <html lang="pt-BR" className={`${cinzel.variable} ${roboto.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
