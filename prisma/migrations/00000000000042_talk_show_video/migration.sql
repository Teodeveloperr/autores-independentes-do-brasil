-- CreateTable
CREATE TABLE "TalkShowVideo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "youtubeUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalkShowVideo_pkey" PRIMARY KEY ("id")
);
