import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = { title: "Termos de Uso" };

const h2Style: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: "#002776", marginTop: "32px", marginBottom: "12px" };
const pStyle: React.CSSProperties = { fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "12px" };
const liStyle: React.CSSProperties = { fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "6px" };

export default function TermosDeUsoPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Termos de Uso</h1>
          <p style={{ fontSize: "16px", marginBottom: "40px" }}>
            As regras que valem para todos que usam o Autores Independentes do Brasil.
          </p>
          <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "40px", borderRadius: "8px", maxWidth: "820px", margin: "0 auto" }}>
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "24px" }}>Última atualização: 1 de setembro de 2026</p>

            <p style={pStyle}>
              Estes Termos de Uso regem o acesso e uso da plataforma Autores Independentes do Brasil
              (&quot;plataforma&quot;, &quot;coletivo&quot;), disponível em autoresdobrasil.com.br. Ao criar uma conta,
              publicar um livro, comprar um livro ou navegar pelo site, você concorda com estes termos. Veja
              também a nossa{" "}
              <Link href="/politica-de-privacidade" style={{ color: "#002776", fontWeight: 600 }}>
                Política de Privacidade
              </Link>
              , que trata especificamente de como tratamos seus dados pessoais.
            </p>

            <h2 style={h2Style}>1. O que é a plataforma</h2>
            <p style={pStyle}>
              O Autores Independentes do Brasil é um coletivo que conecta autores independentes a leitores.
              Autores podem criar um perfil público, publicar livros para venda, divulgar eventos, montar uma
              galeria de fotos e receber avaliações. Leitores podem conhecer autores, comprar livros e avaliar
              autores com quem já tiveram alguma experiência.
            </p>

            <h2 style={h2Style}>2. Cadastro de conta</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Você é responsável por manter suas informações de cadastro corretas e atualizadas.</li>
              <li style={liStyle}>Você é responsável por manter sua senha em sigilo e por toda atividade realizada na sua conta.</li>
              <li style={liStyle}>Não é permitido criar uma conta em nome de terceiros sem autorização, nem se passar por outra pessoa ou autor.</li>
            </ul>

            <h2 style={h2Style}>3. Compra e venda de livros</h2>
            <p style={pStyle}>
              A plataforma atua como intermediária entre autor e comprador — o livro é vendido diretamente pelo
              autor, que é responsável pela qualidade, pelo estoque e pelo envio do produto. O pagamento é
              processado pela Asaas, nossa parceira de pagamentos, e pode ser feito via Pix ou cartão de
              crédito. O frete é calculado por autor, de acordo com a quantidade de livros daquele autor no
              pedido; a postagem em si é feita pelo autor.
            </p>

            <h2 style={h2Style}>4. Planos de assinatura</h2>
            <p style={pStyle}>
              A plataforma oferece diferentes planos para autores, com recursos adicionais (como venda de
              livros, galeria de fotos, agenda de eventos e portfólio completo) conforme o plano contratado.
              Planos pagos têm cobrança recorrente (mensal, semestral ou anual, conforme escolhido), via Pix
              (autorização de débito automático) ou cartão de crédito, processada pela Asaas. Você pode
              cancelar a assinatura a qualquer momento pelo seu painel, sem multa — o plano volta a ser
              gratuito (Iniciante) a partir do cancelamento.
            </p>

            <h2 style={h2Style}>5. Conteúdo publicado por você</h2>
            <p style={pStyle}>
              Você mantém todos os direitos autorais sobre as obras, textos, fotos e demais conteúdos que
              publica. Ao publicar na plataforma, você nos autoriza a exibir esse conteúdo publicamente nas
              páginas do site (perfil, catálogo de livros, galeria, blog e agenda) para o funcionamento normal do
              serviço.
            </p>
            <p style={pStyle}>
              Você é responsável pela veracidade e legalidade do que publica. Não é permitido publicar conteúdo
              que viole direitos autorais de terceiros, seja discriminatório, ofensivo, fraudulento ou ilegal.
            </p>

            <h2 style={h2Style}>6. Avaliações</h2>
            <p style={pStyle}>
              Qualquer visitante pode deixar uma avaliação no perfil público de um autor. Avaliações devem
              refletir uma opinião ou experiência real e não podem conter ofensas, spam ou conteúdo enganoso. A
              equipe do coletivo pode remover avaliações que violem estas regras.
            </p>

            <h2 style={h2Style}>7. Uso aceitável</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Não utilizar a plataforma para fins fraudulentos, ilegais ou para prejudicar outros usuários.</li>
              <li style={liStyle}>Não tentar acessar áreas restritas, contas de terceiros ou dados de outros usuários sem autorização.</li>
              <li style={liStyle}>Não sobrecarregar, atacar ou tentar comprometer a infraestrutura da plataforma.</li>
            </ul>

            <h2 style={h2Style}>8. Encerramento de conta</h2>
            <p style={pStyle}>
              Você pode cancelar sua assinatura paga a qualquer momento pela tela de Configurações do seu
              painel, voltando ao plano gratuito. Você também pode excluir sua conta permanentemente pela
              mesma tela — essa ação apaga em definitivo seu perfil, livros, fotos, portfólio e histórico, e
              não pode ser desfeita. A exclusão fica bloqueada caso existam pedidos pagos aguardando envio ou
              repasse, até que sejam concluídos. Podemos suspender ou encerrar contas que violem estes termos,
              mediante aviso quando possível.
            </p>

            <h2 style={h2Style}>9. Limitação de responsabilidade</h2>
            <p style={pStyle}>
              A plataforma é fornecida &quot;como está&quot;. Fazemos o possível para manter o serviço disponível
              e funcionando corretamente, mas não garantimos operação ininterrupta ou livre de erros. A
              responsabilidade por cada transação de compra e venda é dos autores e compradores envolvidos.
            </p>

            <h2 style={h2Style}>10. Alterações nestes termos</h2>
            <p style={pStyle}>
              Podemos atualizar estes Termos de Uso periodicamente para refletir mudanças na plataforma. A data
              da última atualização está sempre indicada no topo desta página.
            </p>

            <h2 style={h2Style}>11. Contato</h2>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Dúvidas sobre estes Termos de Uso podem ser enviadas para{" "}
              <a href="mailto:contato@autoresdobrasil.com.br" style={{ color: "#002776", fontWeight: 600 }}>
                contato@autoresdobrasil.com.br
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
