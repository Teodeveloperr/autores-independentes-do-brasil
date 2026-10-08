"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Modo = "desenhar" | "digitar" | "imagem";

const LARGURA = 600;
const ALTURA = 200;
const TINTA = "#10106a";
const FONTE_ASSINATURA = 'italic 56px "Segoe Script", "Brush Script MT", "Lucida Handwriting", "Apple Chancery", cursive';

const botaoModo = (ativo: boolean): React.CSSProperties => ({
  background: ativo ? "#002776" : "white",
  color: ativo ? "white" : "#262626",
  border: ativo ? "1px solid #002776" : "1px solid #DDD",
  padding: "8px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
});

/**
 * Quadro de assinatura. Entrega sempre uma imagem PNG (data URL) pelo onChange, qualquer que
 * seja o jeito escolhido: desenhar com o dedo ou o mouse, digitar o nome ou enviar uma imagem.
 */
export default function SignaturePad({
  onChange,
  permitirImagem = false,
  nomeSugerido = "",
}: {
  onChange: (png: string | null) => void;
  permitirImagem?: boolean;
  nomeSugerido?: string;
}) {
  const [modo, setModo] = useState<Modo>("desenhar");
  const [texto, setTexto] = useState(nomeSugerido);
  const [desenhou, setDesenhou] = useState(false);
  const [erroImagem, setErroImagem] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);

  const limpar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, LARGURA, ALTURA);
    setDesenhou(false);
    onChange(null);
  }, [onChange]);

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErroImagem("");
    limpar();
  }

  function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * LARGURA, y: ((e.clientY - rect.top) / rect.height) * ALTURA };
  }

  function iniciarTraco(e: React.PointerEvent<HTMLCanvasElement>) {
    if (modo !== "desenhar") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    const { x, y } = posicao(e);
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  }

  function continuarTraco(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posicao(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function terminarTraco() {
    if (!desenhando.current) return;
    desenhando.current = false;
    setDesenhou(true);
    onChange(canvasRef.current!.toDataURL("image/png"));
  }

  // Modo digitar: redesenha o nome em letra de assinatura sempre que o texto muda.
  useEffect(() => {
    if (modo !== "digitar") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, LARGURA, ALTURA);
    const nome = texto.trim();
    if (!nome) {
      onChange(null);
      return;
    }
    ctx.fillStyle = TINTA;
    ctx.font = FONTE_ASSINATURA;
    ctx.textBaseline = "middle";
    const largura = ctx.measureText(nome).width;
    // Nomes compridos encolhem para caber no quadro.
    const escala = Math.min(1, (LARGURA - 40) / largura);
    ctx.save();
    ctx.translate(20, ALTURA / 2);
    ctx.scale(escala, escala);
    ctx.fillText(nome, 0, 0);
    ctx.restore();
    onChange(canvas.toDataURL("image/png"));
  }, [modo, texto, onChange]);

  function aoEscolherImagem(e: React.ChangeEvent<HTMLInputElement>) {
    setErroImagem("");
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!/^image\/(png|jpeg)$/.test(arquivo.type)) {
      setErroImagem("Envie uma imagem PNG ou JPEG.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, LARGURA, ALTURA);
        const escala = Math.min(LARGURA / img.width, ALTURA / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (LARGURA - w) / 2, (ALTURA - h) / 2, w, h);
        setDesenhou(true);
        onChange(canvas.toDataURL("image/png"));
      };
      img.onerror = () => setErroImagem("Não foi possível abrir essa imagem.");
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" onClick={() => trocarModo("desenhar")} style={botaoModo(modo === "desenhar")}>
          ✍️ Desenhar
        </button>
        <button type="button" onClick={() => trocarModo("digitar")} style={botaoModo(modo === "digitar")}>
          ⌨️ Digitar o nome
        </button>
        {permitirImagem && (
          <button type="button" onClick={() => trocarModo("imagem")} style={botaoModo(modo === "imagem")}>
            🖼️ Enviar imagem
          </button>
        )}
      </div>

      {modo === "digitar" && (
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite o nome que aparecerá como assinatura"
          maxLength={80}
          aria-label="Nome para a assinatura"
          style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
        />
      )}

      {modo === "imagem" && (
        <input type="file" accept="image/png,image/jpeg" onChange={aoEscolherImagem} aria-label="Imagem da assinatura" style={{ fontSize: "13px" }} />
      )}
      {erroImagem && <div style={{ color: "#C0392B", fontSize: "13px" }}>{erroImagem}</div>}

      <canvas
        ref={canvasRef}
        width={LARGURA}
        height={ALTURA}
        onPointerDown={iniciarTraco}
        onPointerMove={continuarTraco}
        onPointerUp={terminarTraco}
        onPointerCancel={terminarTraco}
        aria-label="Quadro de assinatura"
        style={{
          width: "100%",
          maxWidth: `${LARGURA}px`,
          aspectRatio: `${LARGURA} / ${ALTURA}`,
          background: "white",
          border: "1px dashed #999",
          borderRadius: "6px",
          touchAction: modo === "desenhar" ? "none" : "auto",
          cursor: modo === "desenhar" ? "crosshair" : "default",
        }}
      />
      <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "12px", color: "#666" }}>
        <button type="button" onClick={limpar} style={{ background: "white", border: "1px solid #DDD", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
          Limpar
        </button>
        {modo === "desenhar" && !desenhou && <span>Desenhe sua assinatura no quadro com o dedo ou o mouse.</span>}
      </div>
    </div>
  );
}
