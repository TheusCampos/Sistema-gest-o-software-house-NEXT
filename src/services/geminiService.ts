
// Mock Service - Substituindo chamadas reais para demonstração
// import { GoogleGenAI, Type } from "@google/genai";

export const generateSlaTerms = async (clientName: string, planType: string, value: string) => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 2000));

    return `TERMOS E CONDIÇÕES ESPECIAIS (MOCK)

1. Privacidade de Dados (LGPD): A CONTRATADA compromete-se a tratar os dados pessoais do CLIENTE (${clientName}) em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantindo a confidencialidade e integridade das informações processadas na plataforma.

2. Disponibilidade de Suporte: Considerando o plano ${planType}, a Zeus Enterprise assegura um SLA de disponibilidade de 99,9%. O suporte técnico operará em regime 24/7 para chamados críticos, com tempo máximo de resposta de 4 horas.

3. Termos de Pagamento: O valor acordado de R$ ${value} será faturado mensalmente via boleto bancário, com vencimento todo dia 10. Atrasos superiores a 5 dias úteis poderão acarretar suspensão temporária dos serviços até a regularização.`;
};

export const analyzeTicket = async (_description: string) => {
    void _description;
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Retorna uma resposta estática simulando a análise da IA
    return {
        category: "Erro de Sistema",
        priority: "Alto (P2)",
        reasoning: "Análise Simulada (IA): A descrição fornecida menciona falhas intermitentes e mensagens de erro no banco de dados, o que caracteriza um comportamento anômalo do sistema. Devido ao impacto potencial na operação do cliente, a prioridade foi classificada como Alta."
    };
};

export const generateTicketSolution = async (_description: string) => {
    void _description;
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 2500));

    return `
  <p><strong>Diagnóstico Preliminar (IA):</strong></p>
  <p>Com base no relato, o erro parece estar relacionado a um <em>timeout</em> na conexão com o banco de dados ou inconsistência na sessão do usuário.</p>
  
  <p><strong>Procedimento Sugerido:</strong></p>
  <ol>
    <li>Solicitar ao cliente que limpe o cache do navegador (CTRL+F5).</li>
    <li>Verificar nos logs do servidor (Event Viewer) se há registros de "Deadlock" ou "Connection Refused" no horário do incidente.</li>
    <li>Se o erro persistir, reiniciar o serviço de API (IIS/Apache).</li>
    <li>Validar se a versão do client side (frontend) é a mesma do backend (v.2.4.1).</li>
  </ol>
  
  <p><strong>Evidências Necessárias:</strong></p>
  <ul>
    <li>Print da tela de "Console" do navegador (F12) no momento do erro.</li>
    <li>Arquivo de log da aplicação do dia corrente.</li>
  </ul>
  `;
};
