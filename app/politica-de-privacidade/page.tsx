import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = { title: "Política de Privacidade" };

const h2Style: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: "#002776", marginTop: "32px", marginBottom: "12px" };
const pStyle: React.CSSProperties = { fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "12px" };
const liStyle: React.CSSProperties = { fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "6px" };

export default function PoliticaDePrivacidadePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Política de Privacidade</h1>
          <p style={{ fontSize: "16px", marginBottom: "40px" }}>
            Como o Autores Independentes do Brasil coleta, usa e protege os seus dados pessoais.
          </p>
          <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "40px", borderRadius: "8px", maxWidth: "820px", margin: "0 auto" }}>
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "24px" }}>Última atualização: 12 de agosto de 2026</p>

            <p style={pStyle}>
              Esta Política de Privacidade explica quais dados pessoais o Autores Independentes do Brasil coleta ao longo
              da plataforma — como visitante, comprador ou autor cadastrado — para que finalidade usamos essas informações,
              com quem elas podem ser compartilhadas e quais são os seus direitos, em conformidade com a Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>

            <h2 style={h2Style}>1. Quais dados coletamos</h2>
            <p style={pStyle}><strong>Se você compra um livro (checkout):</strong> nome completo, e-mail, telefone (opcional) e endereço de entrega (CEP, rua, número, complemento, bairro, cidade e UF).</p>
            <p style={pStyle}><strong>Se você se cadastra como autor(a):</strong> nome, e-mail, senha (armazenada de forma criptografada), biografia, foto de perfil, redes sociais, cidade e — quando você opta por vender livros físicos — o endereço de origem (CEP) usado para calcular o frete.</p>
            <p style={pStyle}><strong>De forma automática:</strong> itens adicionados ao carrinho de compras (armazenados no seu navegador) e dados técnicos básicos de acesso (como data e hora da requisição), necessários para o funcionamento do site.</p>

            <h2 style={h2Style}>2. Para que usamos esses dados</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Processar e entregar os pedidos realizados na plataforma;</li>
              <li style={liStyle}>Calcular o valor do frete de cada compra através da Melhor Envio;</li>
              <li style={liStyle}>Permitir que o autor entre em contato com o comprador para combinar pagamento e envio, enquanto o pagamento online não está disponível;</li>
              <li style={liStyle}>Exibir o perfil público do autor (nome, bio, foto, livros e redes sociais informadas);</li>
              <li style={liStyle}>Enviar comunicações relacionadas ao seu pedido ou cadastro.</li>
            </ul>

            <h2 style={h2Style}>3. Com quem compartilhamos seus dados</h2>
            <p style={pStyle}>
              Não vendemos nem alugamos seus dados pessoais a terceiros. Compartilhamos apenas o necessário para viabilizar
              a compra:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}><strong>Com o autor vendedor:</strong> nome, contato e endereço de entrega, para que ele possa preparar e enviar o pedido.</li>
              <li style={liStyle}><strong>Com a Melhor Envio:</strong> os CEPs de origem e destino, usados exclusivamente para calcular o valor do frete e, quando aplicável, gerar a postagem.</li>
            </ul>

            <h2 style={h2Style}>4. Cookies e carrinho de compras</h2>
            <p style={pStyle}>
              Usamos cookies e armazenamento local do navegador para manter o carrinho de compras entre as páginas e para
              manter sua sessão logada (como autor ou administrador). Não usamos cookies de rastreamento publicitário.
            </p>

            <h2 style={h2Style}>5. Segurança dos dados</h2>
            <p style={pStyle}>
              Seus dados são armazenados em um banco de dados protegido, com acesso restrito à equipe responsável pela
              plataforma. Senhas nunca são armazenadas em texto simples.
            </p>

            <h2 style={h2Style}>6. Seus direitos</h2>
            <p style={pStyle}>
              De acordo com a LGPD, você pode solicitar, a qualquer momento: confirmação de que tratamos seus dados,
              acesso a eles, correção de informações incompletas ou desatualizadas, e a exclusão dos seus dados pessoais
              da plataforma. Para exercer qualquer um desses direitos, entre em contato pelo e-mail abaixo.
            </p>

            <h2 style={h2Style}>7. Alterações nesta política</h2>
            <p style={pStyle}>
              Esta política pode ser atualizada periodicamente para refletir mudanças na plataforma. A data da última
              atualização está sempre indicada no topo desta página.
            </p>

            <h2 style={h2Style}>8. Contato</h2>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados podem ser enviadas para{" "}
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
