-- CreateTable
CREATE TABLE "ContratoBienal" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "numero" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "pacote" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "valorTabelaCentavos" INTEGER NOT NULL,
    "descontoPercentual" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "planoAssinante" TEXT,
    "textoVersao" TEXT NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "representanteNome" TEXT,
    "representanteCpf" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "autorId" TEXT,
    "codigoHash" TEXT,
    "codigoExpiraEm" TIMESTAMP(3),
    "codigoTentativas" INTEGER NOT NULL DEFAULT 0,
    "emailVerificadoEm" TIMESTAMP(3),
    "assinaturaPng" TEXT,
    "assinadoEm" TIMESTAMP(3),
    "assinaturaIp" TEXT,
    "assinaturaUserAgent" TEXT,
    "pdf" BYTEA,
    "pdfHash" TEXT,
    "asaasCustomerId" TEXT,
    "asaasPaymentId" TEXT,
    "asaasInvoiceUrl" TEXT,
    "valorLiquidoCentavos" INTEGER,
    "pagoEm" TIMESTAMP(3),
    "emailPagoEnviadoEm" TIMESTAMP(3),
    "enviosEmail" INTEGER NOT NULL DEFAULT 0,
    "agendaConflito" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoBienal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoReserva" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "horaInicio" INTEGER NOT NULL,
    "duracaoHoras" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reservado',
    "expiraEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoConfig" (
    "id" TEXT NOT NULL DEFAULT 'unico',
    "assinaturaContratadaPng" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContratoBienal_token_key" ON "ContratoBienal"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoBienal_numero_key" ON "ContratoBienal"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoBienal_asaasPaymentId_key" ON "ContratoBienal"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "ContratoBienal_status_idx" ON "ContratoBienal"("status");

-- CreateIndex
CREATE INDEX "ContratoReserva_tipo_dia_horaInicio_idx" ON "ContratoReserva"("tipo", "dia", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoReserva_contratoId_tipo_dia_horaInicio_key" ON "ContratoReserva"("contratoId", "tipo", "dia", "horaInicio");

-- AddForeignKey
ALTER TABLE "ContratoReserva" ADD CONSTRAINT "ContratoReserva_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoBienal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
