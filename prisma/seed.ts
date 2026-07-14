import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PASSWORD = process.env.SEED_AUTHOR_PASSWORD || "coletivo2026";

async function seedAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || "admin@autoresindependentes.com.br").toLowerCase();
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] admin já existe: ${email}`);
    return;
  }

  const password = process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(9).toString("base64url");
  const senhaHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { email, senhaHash } });

  console.log("\n=== Conta de administrador criada ===");
  console.log(`E-mail (não usado no login, só identifica a conta): ${email}`);
  console.log(`Senha: ${password}`);
  console.log("Guarde essa senha — ela não será exibida novamente.\n");
}

type SeedAuthor = {
  nome: string;
  email: string;
  genero: string;
  cidade: string;
  bio: string;
  anoEntrada: number;
  plano: string;
  livro: { titulo: string; genero: string; precoCentavos: number; capaUrl: string; descricao: string };
};

const AUTHORS: SeedAuthor[] = [
  {
    nome: "Kelly Cortez",
    email: "kelly.cortez@exemplo.com",
    genero: "Romance",
    cidade: "Fortaleza, CE",
    bio: "Autora de romances contemporâneos, Kelly escreve sobre amor, memória e recomeços.",
    anoEntrada: 2024,
    plano: "Autor Essencial",
    livro: {
      titulo: "Aconteceu em Paris",
      genero: "Romance",
      precoCentavos: 4990,
      capaUrl: "/seed/capas/aconteceu-em-paris.png",
      descricao: "Um romance sobre reencontros inesperados nas ruas de Paris.",
    },
  },
  {
    nome: "Denilson Vieira",
    email: "denilson.vieira@exemplo.com",
    genero: "Biografia",
    cidade: "Fortaleza, CE",
    bio: "Pesquisador e escritor dedicado a registrar histórias e valores da cultura afro-brasileira.",
    anoEntrada: 2024,
    plano: "Gratuito",
    livro: {
      titulo: "Umbanda Não Tem Preço! Tem Valores",
      genero: "Biografia",
      precoCentavos: 3990,
      capaUrl: "/seed/capas/umbanda-nao-tem-preco.png",
      descricao: "Um mergulho nos valores e na história da Umbanda no Brasil.",
    },
  },
  {
    nome: "Rômulo Moraes",
    email: "romulo.moraes@exemplo.com",
    genero: "Fantasia",
    cidade: "Fortaleza, CE",
    bio: "Escritor de fantasia, criador do universo de 'Os Guardiões das Relíquias Mágicas'.",
    anoEntrada: 2025,
    plano: "Autor Premium",
    livro: {
      titulo: "Os Guardiões das Relíquias Mágicas: A Cidade de Gelo",
      genero: "Fantasia",
      precoCentavos: 5990,
      capaUrl: "/seed/capas/guardioes-reliquias-magicas.png",
      descricao: "Uma jornada épica por uma cidade congelada guardada por antigas relíquias mágicas.",
    },
  },
  {
    nome: "Gerailson José de Oliveira",
    email: "gerailson.oliveira@exemplo.com",
    genero: "Biografia",
    cidade: "Fortaleza, CE",
    bio: "Escritor reflexivo, aborda temas sobre existência, tempo e espiritualidade.",
    anoEntrada: 2024,
    plano: "Gratuito",
    livro: {
      titulo: "Eu Vou Morrer Sim! Mas Ninguém Vai Morrer Por Mim",
      genero: "Biografia",
      precoCentavos: 3490,
      capaUrl: "/seed/capas/eu-vou-morrer-sim.png",
      descricao: "Uma reflexão profunda sobre a finitude e o sentido da existência.",
    },
  },
  {
    nome: "Arusha Kelly Carvalho de Oliveira",
    email: "arusha.oliveira@exemplo.com",
    genero: "Biografia",
    cidade: "Fortaleza, CE",
    bio: "Educadora e escritora, pesquisa o uso da literatura popular em sala de aula.",
    anoEntrada: 2025,
    plano: "Autor Essencial",
    livro: {
      titulo: "O Cordel em Sala de Aula",
      genero: "Biografia",
      precoCentavos: 4490,
      capaUrl: "/seed/capas/cordel-em-sala-de-aula.png",
      descricao: "Sugestões didático-pedagógicas para o uso da literatura popular visando ao incremento da leitura.",
    },
  },
];

async function seedAuthors() {
  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const a of AUTHORS) {
    const existing = await prisma.author.findUnique({ where: { email: a.email } });
    if (existing) {
      console.log(`[seed] autor já existe: ${a.email}`);
      continue;
    }

    await prisma.author.create({
      data: {
        nome: a.nome,
        email: a.email,
        senhaHash,
        genero: a.genero,
        cidade: a.cidade,
        bio: a.bio,
        anoEntrada: a.anoEntrada,
        plano: a.plano,
        planoCiclo: a.plano === "Gratuito" ? null : "Mensal",
        planoValorCentavos: a.plano === "Autor Essencial" ? 2990 : a.plano === "Autor Premium" ? 4990 : null,
        verificado: true,
        books: {
          create: {
            titulo: a.livro.titulo,
            genero: a.livro.genero,
            precoCentavos: a.livro.precoCentavos,
            estoque: 20,
            capaUrl: a.livro.capaUrl,
            descricao: a.livro.descricao,
          },
        },
      },
    });
    console.log(`[seed] autor criado: ${a.nome} <${a.email}>`);
  }

  console.log(`\n[seed] Senha de todas as contas de autor(a) de exemplo: ${DEMO_PASSWORD}\n`);
}

async function seedCollectiveEvents() {
  const count = await prisma.collectiveEvent.count();
  if (count > 0) {
    console.log("[seed] eventos do coletivo já existem, pulando.");
    return;
  }

  await prisma.collectiveEvent.createMany({
    data: [
      { nome: "Bienal do Livro de São Paulo", dia: 3, mes: "SET", categoria: "Bienais e Feiras", local: "São Paulo, SP", periodo: "03 a 13 de setembro" },
      { nome: "Lançamento Coletivo", dia: 20, mes: "SET", categoria: "Lançamentos", local: "Fortaleza, CE", periodo: "20 de setembro" },
      { nome: "Sarau Literário", dia: 10, mes: "OUT", categoria: "Encontros de Autores", local: "Fortaleza, CE", periodo: "10 de outubro" },
    ],
  });
  console.log("[seed] eventos do coletivo criados.");
}

async function seedCollectiveGallery() {
  const count = await prisma.collectiveGalleryPhoto.count();
  if (count > 0) {
    console.log("[seed] galeria do coletivo já existe, pulando.");
    return;
  }

  await prisma.collectiveGalleryPhoto.createMany({
    data: [
      { titulo: "Bienal do Livro com o coletivo Autores Independentes do Brasil", categoria: "Bienais e Feiras", url: "/seed/galeria/bienal-1.jpg" },
      { titulo: "Encontro de autores na bienal", categoria: "Bienais e Feiras", url: "/seed/galeria/bienal-2.jpg" },
    ],
  });
  console.log("[seed] galeria do coletivo criada.");
}

async function main() {
  await seedAdmin();
  await seedAuthors();
  await seedCollectiveEvents();
  await seedCollectiveGallery();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
