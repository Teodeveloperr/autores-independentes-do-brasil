import Link from "next/link";
import Image from "next/image";
import { getCurrentAuthor } from "@/lib/auth";

type NavKey =
  | "home"
  | "coletivo"
  | "autores"
  | "livros"
  | "eventos"
  | "blog"
  | "galeria"
  | "planos";

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "HOME", href: "/" },
  { key: "coletivo", label: "O COLETIVO", href: "/coletivo" },
  { key: "autores", label: "AUTORES", href: "/autores" },
  { key: "livros", label: "LIVROS", href: "/livros" },
  { key: "eventos", label: "EVENTOS", href: "/eventos" },
  { key: "blog", label: "BLOG", href: "/blog" },
  { key: "galeria", label: "GALERIA", href: "/galeria" },
  { key: "planos", label: "PLANOS", href: "/assinatura" },
];

export default async function PublicHeader({
  active,
  showContato = true,
  cta,
}: {
  active?: NavKey;
  showContato?: boolean;
  cta?: { href: string; label: string };
}) {
  const author = await getCurrentAuthor();

  return (
    <header
      style={{
        background: "white",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E0E0E0",
        gap: "16px",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Image
          src="/logo.png"
          alt="Logo"
          width={160}
          height={40}
          style={{ height: "40px", width: "auto", objectFit: "contain", flexShrink: 0 }}
          priority
        />
      </Link>
      <nav
        style={{
          display: "flex",
          gap: "16px",
          fontSize: "13px",
          fontWeight: 500,
          flexWrap: "wrap",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              color: active === item.key ? "#009B3A" : "#262626",
              fontWeight: active === item.key ? 600 : 500,
            }}
          >
            {item.label}
          </Link>
        ))}
        {author && (
          <Link href="/painel" style={{ color: "#009B3A", fontWeight: 600 }}>
            MEU PAINEL
          </Link>
        )}
        {showContato && (
          <Link href="/#contato" style={{ color: "#262626" }}>
            CONTATO
          </Link>
        )}
      </nav>
      <Link
        href={cta?.href ?? "/login"}
        style={{
          background: "#002776",
          color: "white",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "4px",
          textDecoration: "none",
        }}
      >
        {cta?.label ?? "LOGIN/CADASTRO"}
      </Link>
    </header>
  );
}
