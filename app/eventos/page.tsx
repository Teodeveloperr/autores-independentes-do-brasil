import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventosPage() {
  const eventos = await prisma.collectiveEvent.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="eventos" />
      <section style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Eventos</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Acompanhe os próximos eventos do coletivo e participe de encontros, feiras, palestras e outras atividades literárias em todo o Brasil
        </p>
        <div style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
            <div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px" }}>
                <button style={{ background: "white", padding: 0, fontWeight: 600, color: "#002776" }}>📋 Todos os eventos</button>
                <button style={{ background: "white", padding: 0, fontWeight: 500, color: "#666" }}>🎓 Palestras</button>
                <button style={{ background: "white", padding: 0, fontWeight: 500, color: "#666" }}>🎪 Bienais</button>
                <button style={{ background: "white", padding: 0, fontWeight: 500, color: "#666" }}>👥 Encontros</button>
                <button style={{ background: "white", padding: 0, fontWeight: 500, color: "#666" }}>📚 Lançamentos</button>
                <button style={{ background: "white", padding: 0, fontWeight: 500, color: "#666" }}>💻 Online</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ fontWeight: 600 }}>Maio 2026</div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button style={{ background: "white", border: "1px solid #DDD", padding: "4px 12px" }}>←</button>
                  <button style={{ background: "white", border: "1px solid #DDD", padding: "4px 12px" }}>→</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
                  <div key={d} style={{ textAlign: "center", fontWeight: 600, fontSize: "12px", padding: "8px", color: "#666" }}>{d}</div>
                ))}
                <div style={{ textAlign: "center", padding: "8px", color: "#999" }}>28</div>
                <div style={{ textAlign: "center", padding: "8px", color: "#999" }}>29</div>
                <div style={{ textAlign: "center", padding: "8px", color: "#999" }}>30</div>
                <div style={{ textAlign: "center", padding: "8px", background: "#F6F6F6", borderRadius: "4px" }}>1</div>
                <div style={{ textAlign: "center", padding: "8px", background: "#F6F6F6", borderRadius: "4px" }}>2</div>
                <div style={{ textAlign: "center", padding: "8px", background: "#F6F6F6", borderRadius: "4px" }}>3</div>
                <div style={{ textAlign: "center", padding: "8px", background: "#F6F6F6", borderRadius: "4px" }}>4</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: "16px" }}>Próximos eventos</div>
              {eventos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {eventos.map((ev) => (
                    <div key={ev.id} style={{ display: "flex", gap: "16px", padding: "16px", background: "#F6F6F6", borderRadius: "8px" }}>
                      <div style={{ background: "white", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 14px", textAlign: "center", flexShrink: 0, height: "56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{ev.nome}</div>
                        <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{ev.periodo}</div>
                        <div style={{ fontSize: "13px", color: "#666" }}>📍 {ev.local}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                  Nenhum evento cadastrado no momento. Volte em breve!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
