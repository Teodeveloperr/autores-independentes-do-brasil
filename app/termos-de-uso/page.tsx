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
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "24px" }}>Última atualização: 27 de outubro de 2026</p>

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
              galeria de fotos e receber avaliações. Leitores podem conhecer autores, comprar livros físicos ou
              e-books para leitura online e avaliar autores com quem já tiveram alguma experiência.
            </p>

            <h2 style={h2Style}>2. Cadastro de conta</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Você é responsável por manter suas informações de cadastro corretas e atualizadas.</li>
              <li style={liStyle}>Você é responsável por manter sua senha em sigilo e por toda atividade realizada na sua conta.</li>
              <li style={liStyle}>Não é permitido criar uma conta em nome de terceiros sem autorização, nem se passar por outra pessoa ou autor.</li>
              <li style={liStyle}>Quem compra um e-book recebe uma conta de leitor, criada automaticamente com o e-mail informado na compra (veja a seção 3.1).</li>
            </ul>

            <h2 style={h2Style}>3. Compra e venda de livros</h2>
            <p style={pStyle}>
              A plataforma atua como intermediária entre autor e comprador — o livro é vendido diretamente pelo
              autor, que é responsável pela qualidade, pelo estoque e pelo envio do produto. O pagamento é
              processado pela Asaas, nossa parceira de pagamentos, e pode ser feito via Pix ou cartão de
              crédito. O frete é calculado por autor, de acordo com a quantidade de livros daquele autor no
              pedido; a postagem em si é feita pelo autor.
            </p>

            <h2 style={h2Style}>3.1. E-books (leitura online)</h2>
            <p style={pStyle}>
              E-book é um livro digital, lido dentro da própria plataforma, no navegador. Ao comprar um e-book você
              adquire uma licença pessoal e intransferível de leitura, e não a propriedade da obra nem do arquivo.
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}><strong>Acesso imediato:</strong> assim que o pagamento é confirmado, o e-book aparece na sua estante e enviamos um e-mail com o link para criar a senha da sua conta de leitor (ou o endereço para entrar, se você já tem conta). O e-book não tem frete nem endereço de entrega.</li>
              <li style={liStyle}><strong>Só leitura online:</strong> não há download do arquivo. As páginas são exibidas no navegador e levam uma marca d&apos;água com o nome, o e-mail e um código do leitor.</li>
              <li style={liStyle}><strong>Uso pessoal:</strong> é proibido copiar, fotografar, capturar a tela, redistribuir, compartilhar a conta ou a senha, revender ou publicar o conteúdo, total ou parcialmente. A marca d&apos;água permite identificar o exemplar de origem em caso de vazamento.</li>
              <li style={liStyle}><strong>Aparelhos:</strong> a conta pode ficar conectada em até 2 aparelhos ao mesmo tempo. Ao entrar em um terceiro, o aparelho usado há mais tempo é desconectado. Por segurança, a sessão expira após 30 dias sem uso.</li>
              <li style={liStyle}><strong>Duração:</strong> o acesso à leitura online continua mesmo que o autor retire o e-book da venda ou do site, desde que a conta do leitor esteja regular.</li>
              <li style={liStyle}><strong>Estorno e contestação:</strong> se o pagamento for estornado, cancelado ou contestado junto ao banco ou à operadora do cartão, o acesso ao e-book é encerrado. O acesso também pode ser suspenso em caso de uso indevido, como compartilhamento ou tentativa de copiar o conteúdo.</li>
              <li style={liStyle}><strong>Direito de arrependimento:</strong> como a compra é feita pela internet, você pode desistir em até 7 dias corridos a contar da compra, conforme o art. 49 do Código de Defesa do Consumidor. Para isso, escreva para contato@autoresdobrasil.com.br informando o e-mail usado na compra. O valor é devolvido pela mesma forma de pagamento e o acesso ao e-book é encerrado.</li>
              <li style={liStyle}><strong>Compras repetidas:</strong> um mesmo e-book só pode ser comprado uma vez por e-mail enquanto o acesso estiver ativo. Um pedido pode misturar e-books e livros físicos do mesmo autor; o frete é cobrado apenas sobre os físicos.</li>
            </ul>

            <h2 style={h2Style}>3.2. Autores que vendem e-books</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Se você retirar um e-book da venda, ele deixa de aparecer no site, mas quem já o comprou continua com acesso à leitura online. Se você excluir a sua conta enquanto houver leitores com acesso ativo, a conta é encerrada: seus dados pessoais são apagados e permanecem apenas o seu nome, como crédito da obra, e o e-book vendido, disponível somente a quem já o comprou. Ao publicar um e-book você autoriza essa manutenção.</li>
              <li style={liStyle}>A conta só pode ser excluída depois que o repasse de todas as vendas de e-book já realizadas tiver sido concluído.</li>
              <li style={liStyle}>A venda de e-books está disponível para autores dos planos Essencial, Premium e Premium+.</li>
              <li style={liStyle}>Você declara ser titular dos direitos da obra, ou ter autorização para distribuí-la em formato digital, e responde pelo conteúdo do arquivo enviado.</li>
              <li style={liStyle}>Você nos autoriza a converter o PDF enviado em imagens de página e a guardá-las em armazenamento privado, exclusivamente para a leitura online dos compradores. O PDF original não é guardado pela plataforma; mantenha sua própria cópia.</li>
              <li style={liStyle}>A comissão da plataforma sobre e-books é a mesma do livro físico no seu plano e incide sobre o valor líquido recebido, já descontada a tarifa da Asaas.</li>
              <li style={liStyle}>O repasse é feito assim que a Asaas libera o valor da venda: no Pix, em geral na hora; no cartão de crédito, apenas após o prazo de liberação da operadora (cerca de 32 dias). O comprador tem acesso imediato mesmo quando o repasse ainda está em espera.</li>
              <li style={liStyle}>Se um pagamento for estornado ou contestado, o acesso do comprador é encerrado. Caso o repasse daquela venda já tenha sido feito, a devolução do valor será solicitada ao autor.</li>
            </ul>

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
              repasse, até que sejam concluídos, ou vendas de e-book com repasse em andamento. Se houver e-books vendidos com leitores ainda com acesso, a exclusão encerra a conta e apaga seus dados pessoais, mantendo apenas o seu nome, como crédito da obra, e o e-book para quem o comprou. Leitores que compraram e-books podem pedir a exclusão da conta de leitor
              pelo e-mail de contato; o acesso aos e-books comprados é encerrado junto. Podemos suspender ou encerrar contas que violem estes termos,
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
