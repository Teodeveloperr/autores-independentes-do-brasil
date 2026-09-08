// Extrai o ID de um vídeo a partir de um link do YouTube em qualquer formato comum
// (watch?v=, youtu.be/, embed/, shorts/). Usado tanto no servidor (validação, embed da
// página pública) quanto no cliente (prévia no admin) — sem "use server"/"server-only".
export function extrairYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}
