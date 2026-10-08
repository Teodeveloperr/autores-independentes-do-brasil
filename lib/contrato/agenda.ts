import "server-only";
import { prisma } from "@/lib/db";
import {
  DIAS_BIENAL,
  ESPACOS,
  PACOTES,
  chaveHorario,
  horasInicioDoEspaco,
  type HorarioEscolhido,
  type PacoteContrato,
  type TipoEspaco,
} from "./config";

// Agenda de balcão e auditório. Toda escrita passa por uma transação com trava (advisory
// lock) do Postgres: duas pessoas escolhendo o último lugar do mesmo horário ao mesmo tempo
// são atendidas uma de cada vez, e a segunda recebe o aviso de horário lotado.

const LOCK_AGENDA = 7305001;

type Cliente = Pick<typeof prisma, "contratoReserva" | "$queryRawUnsafe">;

function diaIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Quantas reservas válidas (confirmadas ou ainda dentro do prazo) existem em cada horário. */
export async function carregarOcupacao(opcoes: { ignorarContratoId?: string; cliente?: Cliente } = {}): Promise<Record<string, number>> {
  const db = opcoes.cliente ?? prisma;
  const reservas = await db.contratoReserva.findMany({
    where: {
      OR: [{ status: "confirmado" }, { status: "reservado", expiraEm: { gt: new Date() } }],
      ...(opcoes.ignorarContratoId ? { contratoId: { not: opcoes.ignorarContratoId } } : {}),
    },
    select: { tipo: true, dia: true, horaInicio: true },
  });
  const ocupacao: Record<string, number> = {};
  for (const r of reservas) {
    const chave = chaveHorario({ tipo: r.tipo as TipoEspaco, dia: diaIso(r.dia), horaInicio: r.horaInicio });
    ocupacao[chave] = (ocupacao[chave] ?? 0) + 1;
  }
  return ocupacao;
}

/** Confere se a escolha respeita o que o pacote dá direito. Devolve a mensagem de erro, ou null. */
export function validarSelecao(pacote: PacoteContrato, selecao: HorarioEscolhido[]): string | null {
  const direitos = PACOTES[pacote];
  const chaves = new Set<string>();
  const porTipo: Record<TipoEspaco, number> = { balcao: 0, auditorio: 0 };

  for (const h of selecao) {
    if (h.tipo !== "balcao" && h.tipo !== "auditorio") return "Horário inválido.";
    if (!(DIAS_BIENAL as readonly string[]).includes(h.dia)) return "Escolha um dia entre 3 e 12 de setembro de 2027.";
    if (!horasInicioDoEspaco(h.tipo).includes(h.horaInicio)) return "Escolha um horário entre 10h e 20h.";
    const chave = chaveHorario(h);
    if (chaves.has(chave)) return "Você escolheu o mesmo horário duas vezes.";
    chaves.add(chave);
    porTipo[h.tipo] += 1;
  }

  if (porTipo.balcao !== direitos.balcao) {
    return `O pacote ${direitos.nome} inclui ${direitos.balcao} ${direitos.balcao === 1 ? "período" : "períodos"} de balcão. Escolha ${direitos.balcao === 1 ? "o horário" : "todos os horários"}.`;
  }
  if (porTipo.auditorio !== direitos.auditorio) {
    return `O pacote ${direitos.nome} inclui ${direitos.auditorio} ${direitos.auditorio === 1 ? "hora" : "horas"} de auditório. Escolha o horário.`;
  }
  return null;
}

export type ResultadoReserva = { ok: true } | { ok: false; erro: string };

/** Substitui as reservas do contrato pelas novas, se todos os horários ainda tiverem vaga. */
export async function reservarHorarios(contratoId: string, selecao: HorarioEscolhido[], expiraEm: Date): Promise<ResultadoReserva> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${LOCK_AGENDA})`);
    const ocupacao = await carregarOcupacao({ ignorarContratoId: contratoId, cliente: tx as unknown as Cliente });

    for (const h of selecao) {
      if ((ocupacao[chaveHorario(h)] ?? 0) >= ESPACOS[h.tipo].capacidade) {
        return { ok: false as const, erro: "Um dos horários escolhidos acabou de ser ocupado. Escolha outro horário." };
      }
    }

    await tx.contratoReserva.deleteMany({ where: { contratoId } });
    await tx.contratoReserva.createMany({
      data: selecao.map((h) => ({
        contratoId,
        tipo: h.tipo,
        dia: new Date(`${h.dia}T00:00:00Z`),
        horaInicio: h.horaInicio,
        duracaoHoras: ESPACOS[h.tipo].duracaoHoras,
        status: "reservado",
        expiraEm,
      })),
    });
    return { ok: true as const };
  });
}

/** Prorroga o prazo das reservas ainda não pagas (usado quando o contrato é assinado). */
export async function prorrogarReservas(contratoId: string, expiraEm: Date) {
  await prisma.contratoReserva.updateMany({ where: { contratoId, status: "reservado" }, data: { expiraEm } });
}

/**
 * Torna definitivas as reservas do contrato pago. Se o prazo da reserva já tinha vencido e
 * outra pessoa ocupou o último lugar nesse meio tempo, ainda assim confirma (a pessoa pagou)
 * e devolve conflito = true pra a administração resolver no painel.
 */
export async function confirmarReservas(contratoId: string): Promise<{ conflito: boolean }> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${LOCK_AGENDA})`);
    const proprias = await tx.contratoReserva.findMany({ where: { contratoId } });
    const ocupacao = await carregarOcupacao({ ignorarContratoId: contratoId, cliente: tx as unknown as Cliente });

    let conflito = false;
    for (const r of proprias) {
      const chave = chaveHorario({ tipo: r.tipo as TipoEspaco, dia: diaIso(r.dia), horaInicio: r.horaInicio });
      if ((ocupacao[chave] ?? 0) >= ESPACOS[r.tipo as TipoEspaco].capacidade) conflito = true;
    }
    await tx.contratoReserva.updateMany({ where: { contratoId }, data: { status: "confirmado", expiraEm: null } });
    return { conflito };
  });
}

export function horariosDasReservas(reservas: { tipo: string; dia: Date; horaInicio: number }[]): HorarioEscolhido[] {
  return reservas
    .map((r) => ({ tipo: r.tipo as TipoEspaco, dia: diaIso(r.dia), horaInicio: r.horaInicio }))
    .sort((a, b) => a.dia.localeCompare(b.dia) || a.horaInicio - b.horaInicio || a.tipo.localeCompare(b.tipo));
}
