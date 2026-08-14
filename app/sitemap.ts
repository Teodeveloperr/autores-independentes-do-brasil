import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [authors, artigos] = await Promise.all([
    prisma.author.findMany({ select: { id: true, updatedAt: true } }),
    prisma.article.findMany({ select: { id: true, createdAt: true } }),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/coletivo`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/autores`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/livros`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/eventos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/galeria`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/assinatura`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/termos-de-uso`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const paginasAutores: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${SITE_URL}/perfil/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const paginasArtigos: MetadataRoute.Sitemap = artigos.map((a) => ({
    url: `${SITE_URL}/blog/${a.id}`,
    lastModified: a.createdAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...paginasEstaticas, ...paginasAutores, ...paginasArtigos];
}
