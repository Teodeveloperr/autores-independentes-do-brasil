import Link from "next/link";
import Image from "next/image";
import { getCurrentAuthor, getCurrentAdmin } from "@/lib/auth";
import MobileNavPanel from "./MobileNavPanel";
import NavDropdown from "./NavDropdown";
import CartBadge from "./CartBadge";

type NavKey =
  | "home"
  | "coletivo"
  | "autores"
  | "livros"
  | "eventos"
  | "blog"
  | "galeria"
  | "planos"
  | "cadastro"
  | "oportunidades"
  | "talkshow"
  | "contato";

type NavItem = { key: NavKey; label: string; href: string };

function categorias(showContato: boolean): { label: string; items: NavItem[] }[] {
  return [
    {
      label: "DESCOBRIR",
      items: [
        { key: "autores", label: "Autores", href: "/autores" },
        { key: "livros", label: "Livros", href: "/livros" },
        { key: "eventos", label: "Eventos", href: "/eventos" },
      ],
    },
    {
      label: "PARTICIPAR",
      items: [
        { key: "planos", label: "Planos", href: "/assinatura" },
        { key: "cadastro", label: "Cadastre-se", href: "/cadastro" },
        { key: "oportunidades", label: "Oportunidades", href: "/oportunidades" },
      ],
    },
    {
      label: "COMUNIDADE",
      items: [
        { key: "blog", label: "Blog", href: "/blog" },
        { key: "galeria", label: "Galeria", href: "/galeria" },
        { key: "talkshow", label: "Talk Show / Conteúdos", href: "/talk-show" },
      ],
    },
    {
      label: "SOBRE",
      items: [
        { key: "coletivo", label: "O Coletivo", href: "/coletivo" },
        ...(showContato ? [{ key: "contato" as const, label: "Contato", href: "/#contato" }] : []),
      ],
    },
  ];
}

export default async function PublicHeader({
  active,
  showContato = true,
  cta,
}: {
  active?: NavKey;
  showContato?: boolean;
  cta?: { href: string; label: string };
}) {
  const [author, admin] = await Promise.all([getCurrentAuthor(), getCurrentAdmin()]);
  const resolvedCta = cta ?? { href: "/login", label: "LOGIN/CADASTRO" };
  const cats = categorias(showContato);

  const utilLinks = [
    ...(author ? [{ key: "painel", label: "MEU PAINEL", href: "/painel", active: false }] : []),
    ...(admin ? [{ key: "admin", label: "PAINEL ADMIN", href: "/admin", active: false }] : []),
    { key: "carrinho", label: "🛒 CARRINHO", href: "/carrinho", active: false },
  ];

  const mobileGroups = [
    { label: "", items: [{ key: "home", label: "INÍCIO", href: "/", active: active === "home" }] },
    ...cats.map((c) => ({
      label: c.label,
      items: c.items.map((item) => ({ key: item.key, label: item.label, href: item.href, active: active === item.key })),
    })),
    { label: "", items: utilLinks },
  ];

  return (
    <header
      style={{
        position: "relative",
        background: "white",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E0E0E0",
        gap: "16px",
        flexWrap: "wrap",
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
        className="nav-desktop"
        style={{
          gap: "24px",
          fontSize: "13px",
          fontWeight: 500,
          flexWrap: "wrap",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ color: active === "home" ? "#009B3A" : "#262626", fontWeight: active === "home" ? 600 : 500 }}>
          INÍCIO
        </Link>
        {cats.map((c) => (
          <NavDropdown key={c.label} label={c.label} items={c.items} activeKey={active} />
        ))}
        {author && (
          <Link href="/painel" style={{ color: "#009B3A", fontWeight: 600 }}>
            MEU PAINEL
          </Link>
        )}
        {admin && (
          <Link href="/admin" style={{ color: "#009B3A", fontWeight: 600 }}>
            PAINEL ADMIN
          </Link>
        )}
        <CartBadge style={{ fontWeight: 600 }} />
      </nav>
      <Link
        href={resolvedCta.href}
        className="nav-desktop"
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
        {resolvedCta.label}
      </Link>
      <MobileNavPanel groups={mobileGroups} cta={resolvedCta} />
    </header>
  );
}
