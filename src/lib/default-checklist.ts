export const DEFAULT_CHECKLIST = [
  {
    title: "Identificação do Veículo",
    order: 1,
    items: [
      { title: "Tipo (Carro/Moto/Van)", options: ["Carro", "Moto", "Van"], order: 1 },
      { title: "Modelo", options: ["Informado"], order: 2 },
      { title: "Placa", options: ["Informado"], order: 3 },
      { title: "KM Atual", options: ["Informado"], order: 4 },
      { title: "Motorista responsável", options: ["Informado"], order: 5 },
      { title: "Data e hora da inspeção", options: ["Registrado"], order: 6 }
    ]
  },
  {
    title: "Condição Externa",
    order: 2,
    items: [
      { title: "Pintura", options: ["Ok", "Arranhões", "Amassados"], order: 1 },
      { title: "Para-choques", options: ["Ok", "Danificados"], order: 2 },
      { title: "Retrovisores", options: ["Ok", "Trincado", "Faltando"], order: 3 },
      { title: "Vidros", options: ["Ok", "Trincados", "Rachados"], order: 4 },
      { title: "Faróis", options: ["Ok", "Queimado", "Sujo"], order: 5 },
      { title: "Lanternas", options: ["Ok", "Queimado"], order: 6 },
      { title: "Pneus dianteiros", options: ["Bons", "Gasto", "Trocar"], order: 7 },
      { title: "Pneus traseiros", options: ["Bons", "Gasto", "Trocar"], order: 8 },
      { title: "Estepe", options: ["Ok", "Vazio", "Ausente"], order: 9 },
      { title: "Calotas / Rodas", options: ["Ok", "Danificadas"], order: 10 }
    ]
  },
  {
    title: "Condição Interna",
    order: 3,
    items: [
      { title: "Banco do motorista", options: ["Ok", "Rasgado"], order: 1 },
      { title: "Bancos passageiros", options: ["Ok", "Rasgado"], order: 2 },
      { title: "Painel", options: ["Ok", "Luz de alerta"], order: 3 },
      { title: "Ar-condicionado", options: ["Gelando", "Fraco", "Não funciona"], order: 4 },
      { title: "Som/Multimídia", options: ["Ok", "Não funciona"], order: 5 },
      { title: "Travas elétricas", options: ["Ok", "Defeito"], order: 6 },
      { title: "Vidros elétricos", options: ["Ok", "Defeito"], order: 7 },
      { title: "Cintos de segurança", options: ["Ok", "Danificado"], order: 8 },
      { title: "Limpeza interna", options: ["Limpo", "Sujo"], order: 9 }
    ]
  },
  {
    title: "Itens de Segurança",
    order: 4,
    items: [
      { title: "Extintor", options: ["Dentro da validade", "Vencido"], order: 1 },
      { title: "Triângulo", options: ["Ok", "Faltando"], order: 2 },
      { title: "Macaco", options: ["Ok", "Faltando"], order: 3 },
      { title: "Chave de roda", options: ["Ok", "Faltando"], order: 4 },
      { title: "Kit primeiros socorros", options: ["Ok", "Incompleto"], order: 5 },
      { title: "Capacete (motos)", options: ["Ok", "Viseira ruim", "Trocar"], order: 6 }
    ]
  },
  {
    title: "Parte Mecânica",
    order: 5,
    items: [
      { title: "Óleo do motor", options: ["Ok", "Baixo", "Vazando"], order: 1 },
      { title: "Água do radiador", options: ["Ok", "Baixa"], order: 2 },
      { title: "Freios", options: ["Ok", "Chiando", "Fraco"], order: 3 },
      { title: "Embreagem (carros)", options: ["Ok", "Patinando"], order: 4 },
      { title: "Corrente (motos)", options: ["Ok", "Frouxa", "Ressecada"], order: 5 },
      { title: "Bateria", options: ["Ok", "Fraca"], order: 6 },
      { title: "Direção", options: ["Ok", "Dura", "Barulho"], order: 7 },
      { title: "Suspensão", options: ["Ok", "Ruído"], order: 8 },
      { title: "Vazamentos visíveis", options: ["Sim", "Não"], order: 9 }
    ]
  },
  {
    title: "Limpeza",
    order: 6,
    items: [
      { title: "Lavagem externa", options: ["Feita", "Necessário"], order: 1 },
      { title: "Lavagem interna", options: ["Feita", "Necessário"], order: 2 },
      { title: "Higienização dos bancos", options: ["Ok", "Necessário"], order: 3 },
      { title: "Porta-malas", options: ["Ok", "Necessário"], order: 4 },
      { title: "Motor", options: ["Ok", "Necessário"], order: 5 }
    ]
  },
  {
    title: "Documentação",
    order: 7,
    items: [
      { title: "Documento do veículo", options: ["No veículo", "Faltando"], order: 1 },
      { title: "IPVA", options: ["Pago", "Pendente"], order: 2 },
      { title: "Licenciamento", options: ["Ok", "Vencido"], order: 3 },
      { title: "Seguro", options: ["Ok", "Pendente"], order: 4 }
    ]
  }
];
