import type { Metadata, Viewport } from "next";
import { Cinzel, Roboto } from "next/font/google";
import { CartProvider } from "@/components/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartConflictModal from "@/components/CartConflictModal";
import VisitTracker from "@/components/VisitTracker";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

export const metadata: Metadata = {
  // Endereço base pra montar o link completo das imagens de prévia (WhatsApp, Instagram, Facebook).
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Autores Independentes do Brasil",
    template: "%s · Autores Independentes do Brasil",
  },
  description:
    "Coletivo de escritores independentes do Brasil — perfis de autores, livros à venda, eventos e blog.",
  // Prévia padrão ao compartilhar qualquer página sem imagem própria (perfil de autor define a sua).
  openGraph: {
    type: "website",
    siteName: "Autores Independentes do Brasil",
    locale: "pt_BR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Autores do coletivo reunidos no estande da Bienal do Livro" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${roboto.variable}`}>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
          <CartConflictModal />
        </CartProvider>
        <VisitTracker />
      </body>
    </html>
  );
}
