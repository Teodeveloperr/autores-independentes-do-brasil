// Faixa fixa no topo durante o tema de Halloween. Fica escondida (CSS) fora do período.
export default function BarraHalloween() {
  return (
    <div className="hw-barra" role="note">
      <span className="hw-mini" aria-hidden="true" /> <b>Semana do Halloween</b> · de 27/10 a 03/11 · leituras que dão arrepios 👻🦇
    </div>
  );
}
