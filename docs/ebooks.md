# E-books

Livro digital lido **só dentro da plataforma**, em páginas-imagem com marca d'água do leitor. Não há download do arquivo.
Venda, acesso e repasse: ver também [fluxos-de-dinheiro.md](fluxos-de-dinheiro.md#2-compra-de-e-book).

## Visão geral

```
AUTOR (painel)                         COMPRADOR                          LEITOR
escolhe "E-book" + PDF                 compra no site (Pix/cartão)        /entrar → /estante → /ler/<livro>
   │ converte NO NAVEGADOR                 │ pagamento confirma                   │
   ▼                                       ▼                                      ▼
páginas WebP ─► Blob PRIVADO         acesso liberado + e-mail            /api/ler/<livro>/<n> entrega
(ebooks/<livro>/<versão>/…)          (1 e-mail por compra)               cada página COM a marca d'água
```

## Do lado do autor

**Quem pode**: planos Essencial, Premium e Premium+ (`podeVenderLivros`).

1. Em **Painel → Meus Livros**, o autor escolhe **E-book (leitura online)**, preenche título, preço e capa, e escolhe o **PDF**.
2. O livro nasce com status `processando` e **não aparece na vitrine** (só e-books `pronto` aparecem e podem ser comprados).
3. O **navegador do autor** abre o PDF (`pdfjs-dist`) e, página por página, desenha, comprime em **WebP** e envia
   (`lib/ebookPdfCliente.ts` → `components/painel/EnvioEbook.tsx`). **O PDF original nunca sobe inteiro e não é guardado**:
   o autor deve manter a própria cópia.
4. Cada página vai para `POST /api/painel/ebook/<livro>/pagina?versao=…&numero=…`, que valida a imagem (`sharp`) e grava no
   Blob **privado** em `ebooks/<livro>/<versão>/NNNN-<largura>x<altura>.webp`. A largura e a altura vão no nome do arquivo.
5. Ao terminar, `finalizarEnvioEbook` confere que **todas** as páginas chegaram, grava a lista (`EbookPagina`), marca o livro
   como `pronto` e **apaga as versões antigas**.
6. Se algo falha, o livro fica `erro` com a mensagem (ex.: "PDF protegido por senha") e o autor pode enviar de novo.

**Trocar o PDF** de um e-book já pronto usa uma **versão nova**: a antiga continua valendo até a nova terminar, então
**quem já comprou não perde a leitura** no meio da troca.

| Limite | Valor | Onde |
|---|---|---|
| tamanho do PDF | 200 MB | `EBOOK_MAX_PDF_BYTES` em `lib/ebook.ts` |
| páginas | 600 | `EBOOK_MAX_PAGINAS` |
| cada página convertida | 4 MB (limite de corpo de uma função da Vercel) | `EBOOK_MAX_PAGINA_BYTES` |
| tamanho da imagem de página | 1000 a 1600 px de largura, até 2600 de altura | `lib/ebookPdfCliente.ts` |

PDF com senha ou corrompido é recusado com mensagem clara. A conversão de um PDF grande (80 MB, 161 páginas) levou cerca de
7 minutos no navegador de teste: o gargalo é desenhar páginas com muitas imagens, não o servidor.

## Do lado do leitor

- **Primeiro acesso**: depois do pagamento, o leitor recebe um e-mail com um **link único** (válido por 7 dias) para criar a
  senha. Quem já tem conta recebe o endereço de entrada.
- **Entrada**: `/entrar` (e-mail e senha), `/entrar/esqueci` (recuperação, link válido por 1 hora). Sessão de **30 dias**, no
  máximo **2 aparelhos**: ao entrar num terceiro, o mais antigo é desconectado.
- **Estante** (`/estante`): lista os e-books com acesso ativo. **Leitura** (`/ler/<livro>`): rolagem contínua, zoom, ir para a
  página, tela cheia; lembra onde parou **só neste aparelho** (localStorage).
- **Quem entrega as páginas**: `GET /api/ler/<livro>/<n>`. É a **única** porta de saída: confere a sessão, o acesso ao livro e o
  ritmo (no máximo **90 páginas por minuto**, o que barra quem tenta baixar tudo). A resposta é `private, no-store`.
- **Marca d'água** (`lib/marcaDagua.tsx`): gravada na própria imagem, com **nome, e-mail e um código** (últimos 6 caracteres do
  id do acesso): um rodapé e três faixas diagonais. Um print ou foto de tela carrega a identificação do exemplar.
- **O que isto protege e o que não**: a plataforma **dissuade** e **identifica**: sem download, sem cache, sem impressão
  (a impressão é bloqueada por CSS), marca d'água por leitor, limite de ritmo. **Não impede** foto de tela. Trate vazamento
  como caso para **revogar o acesso** do exemplar identificado.

## Acesso: liberar, revogar, reativar

`lib/leitorAcesso.ts` é o único lugar que concede ou revoga acesso.

| Evento | O que acontece |
|---|---|
| pagamento confirmado (webhook) | cria o `Leitor` (se não existe) e o `AcessoEbook`; **1 e-mail** com todos os títulos da compra |
| estorno ou chargeback | acesso **revogado** (`revogadoEm`, com motivo) e pedido "Cancelado" |
| nova compra do mesmo livro | reativa um acesso revogado (o checkout **bloqueia** recompra enquanto o acesso estiver ativo) |
| admin | **Admin → E-books**: revogar (com motivo), reativar, reenviar e-mail, desconectar aparelhos, liberar manualmente (cortesia, sem pedido nem repasse) |

## Quando o autor retira o e-book ou exclui a conta

Regra de negócio: **quem comprou continua com acesso**, mesmo que o autor retire o livro do site.

- **Remover o e-book** (`removeBook`, `app/painel/actions.ts`): se **há leitor com acesso ativo**, o livro **não é apagado**: vira
  status `retirado` (sai da vitrine e da lista do autor; a leitura segue). Sem leitores, é apagado e as páginas saem do armazenamento.
- **Excluir a conta** (`excluirOuEncerrarAutor`, `lib/authorDeletion.ts`): sem e-books com leitores ativos, a conta é
  **excluída por completo**. Com leitores ativos, a conta é **encerrada**: status `encerrado`, **dados pessoais apagados** (e-mail,
  senha, CPF, Pix, endereço, bio, fotos, plano, assinaturas, eventos...), mantidos **só o nome** (crédito da obra), os
  e-books vendidos (`retirado`) e os pedidos deles. Conta encerrada não entra, não aparece no site e **não pode ser reativada**.
- **Trava que sobra**: a conta só é excluída **depois que o repasse de todas as vendas de e-book** já feitas tiver sido
  concluído (cartão: cerca de 32 dias): o sistema precisa da chave Pix do autor para pagá-lo.

Os Termos de Uso e a Política de Privacidade descrevem estas regras para o público.

## Onde está o código

| O quê | Arquivo |
|---|---|
| regras comuns, limites, quais status permitem leitura | `lib/ebook.ts` |
| armazenamento privado (ler, gravar, listar, apagar) | `lib/ebookStorage.ts` |
| conversão do PDF no navegador | `lib/ebookPdfCliente.ts`, `components/painel/EnvioEbook.tsx` |
| abrir e fechar o envio (iniciar, finalizar, registrar falha) | `app/painel/ebookActions.ts` |
| receber cada página | `app/api/painel/ebook/[bookId]/pagina/route.ts` |
| conta, sessão e links do leitor | `lib/leitorAuth.ts`, `lib/leitorLinks.ts`, `app/entrar/*` |
| acesso (liberar/revogar), e-mail de acesso | `lib/leitorAcesso.ts`, `lib/pedidoEbook.ts` |
| entrega da página + marca d'água | `app/api/ler/[bookId]/[numero]/route.ts`, `lib/marcaDagua.tsx` |
| telas do leitor | `app/estante`, `app/ler/[id]`, `components/leitor/LeitorEbook.tsx` |
| administração | `components/admin/AdminEbooksView.tsx` e ações em `app/admin/actions.ts` |
