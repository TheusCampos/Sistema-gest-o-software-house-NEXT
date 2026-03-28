// ── Aba: Dados Básicos ─────────────────────────────────────
export interface ClientGeneralInfo {
    razao: string;
    fantasia?: string | null;
    tipoPessoa: 'Juridica' | 'Fisica';
    documento: string;          // CNPJ ou CPF (sem máscara no banco)
    inscricaoEstadualRg?: string | null;
    dataAbertura?: string | null;      // ISO date: "YYYY-MM-DD"
    email: string;
    telefone1?: string | null;
    telefone2?: string | null;
    homePage?: string | null;
    contatoResponsavel?: string | null;
    observacao?: string | null;
    serverId?: string | null;
}

// ── Aba: Endereço ──────────────────────────────────────────
export interface ClientAddressInfo {
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    uf: string;                 // 2 letras
    cep: string;                // 8 dígitos, sem traço
}

// ── Aba: Contrato ──────────────────────────────────────────
export interface ClientContractInfo {
    valorImplantacao?: number | null;
    valorMensal?: number | null;
    percentualComissao?: number | null;
    diaVencimento?: number | null;
    mesAjuste?: string | null;
    percentualAjuste?: number | null;
    terminais?: number | null;
    dataImplantacao?: string | null;
    inicioMensal?: string | null;
    liberacao: boolean;
}

// ── Aba: Módulos ───────────────────────────────────────────
export interface ClientModulesInfo {
    contasReceber: boolean;
    contasPagar: boolean;
    faturamento: boolean;
    estoque: boolean;
    nfe: boolean;
    sped: boolean;
    spedPisCofins: boolean;
    servico: boolean;
    pacote: boolean;
    movimentoBancario: boolean;
    crediario: boolean;
    nfce: boolean;
    nfse: boolean;
    ferramentasGestao: boolean;
}

// ── Aba: Status ────────────────────────────────────────────
export interface ClientStatusInfo {
    possuiCredito: boolean;
    suspensoParado: boolean;
    agenteVendas: boolean;
    permiteVendaPrazo: boolean;
    bloqueadoLiberacao: boolean;
    contratoAssinado: boolean;
    bloqueado: boolean;
    recebimentoCarteira: boolean;
    semRecebimento: boolean;
    ajudaCusto: boolean;
}

// ── Objeto raiz: Client ────────────────────────────────────
export interface Client {
    id: string;
    tenantId: string;
    active: boolean;
    createdAt?: string;
    general: ClientGeneralInfo;
    address: ClientAddressInfo;
    contract: ClientContractInfo;
    modules: ClientModulesInfo;
    status: ClientStatusInfo;
}

// ── Valores default para campos novos (compatibilidade) ────
export const defaultContractInfo: ClientContractInfo = {
    liberacao: false,
};

export const defaultModulesInfo: ClientModulesInfo = {
    contasReceber: false, contasPagar: false, faturamento: false,
    estoque: false, nfe: false, sped: false, spedPisCofins: false,
    servico: false, pacote: false, movimentoBancario: false,
    crediario: false, nfce: false, nfse: false, ferramentasGestao: false,
};

export const defaultStatusInfo: ClientStatusInfo = {
    possuiCredito: false, suspensoParado: false, agenteVendas: false,
    permiteVendaPrazo: false, bloqueadoLiberacao: false, contratoAssinado: false,
    bloqueado: false, recebimentoCarteira: false, semRecebimento: false,
    ajudaCusto: false,
};
