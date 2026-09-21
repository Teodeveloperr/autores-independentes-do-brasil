// Listas de valores fixos usadas tanto nos formulários do painel (as opções mostradas)
// quanto na validação em runtime das Server Actions que os recebem — uma fonte única,
// pra não desalinhar o que aparece na tela do que o servidor aceita.

export const MESES_EVENTO = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;

export const STATUS_EVENTO = ["Confirmado", "Pendente"] as const;

export const STATUS_PEDIDO = ["Aguardando pagamento", "Pago", "Aguardando envio", "Enviado", "Entregue", "Cancelado"] as const;

export const CATEGORIAS_FOTO = [
  "Bienais e Feiras",
  "Lançamentos",
  "Palestras e Workshops",
  "Encontros de Autores",
  "Eventos Culturais",
  "Outros",
] as const;
