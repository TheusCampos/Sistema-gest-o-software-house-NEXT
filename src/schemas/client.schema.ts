import { z } from 'zod';
import {
    ClientGeneralInfo,
    ClientAddressInfo,
    ClientContractInfo,
    ClientModulesInfo,
    ClientStatusInfo,
    Client,
    defaultContractInfo,
    defaultModulesInfo,
    defaultStatusInfo
} from '@/types';

function validateCnpjOrCpf(val: string) {
    const clean = val.replace(/\D/g, '');
    return clean.length === 11 || clean.length === 14;
}

export const generalSchema = z.object({
    razao: z.string().min(2, 'Razão Social obrigatória'),
    fantasia: z.string().nullish(),
    tipoPessoa: z.enum(['Juridica', 'Fisica']),
    documento: z.string()
        .refine(validateCnpjOrCpf, { message: 'CNPJ ou CPF inválido' }),
    inscricaoEstadualRg: z.string().nullish(),
    dataAbertura: z.string().nullish(),
    email: z.string().email('E-mail inválido'),
    telefone1: z.string().nullish(),
    telefone2: z.string().nullish(),
    homePage: z.string().nullish().or(z.literal('')),
    contatoResponsavel: z.string().nullish(),
    observacao: z.string().nullish(),
    serverId: z.string().uuid().nullish().or(z.literal('')),
});

export const addressSchema = z.object({
    logradouro: z.string().min(1, 'Logradouro obrigatório'),
    numero: z.string().min(1, 'Número obrigatório'),
    complemento: z.string().nullish(),
    bairro: z.string().min(1, 'Bairro obrigatório'),
    cidade: z.string().min(1, 'Cidade obrigatória'),
    uf: z.string().length(2, 'UF deve ter 2 caracteres'),
    cep: z.string().length(8, 'CEP deve ter 8 dígitos').regex(/^\d{8}$/, 'CEP deve conter apenas números'),
});

export const contractSchema = z.object({
    valorImplantacao: z.number().nonnegative().nullish(),
    valorMensal: z.number().nonnegative().nullish(),
    percentualComissao: z.number().min(0).max(100).nullish(),
    diaVencimento: z.number().int().min(1).max(31).nullish(),
    mesAjuste: z.string().nullish(),
    percentualAjuste: z.number().min(0).max(100).nullish(),
    terminais: z.number().int().positive().nullish(),
    dataImplantacao: z.string().nullish(),
    inicioMensal: z.string().nullish(),
    liberacao: z.boolean().default(false),
});

export const modulesSchema = z.object({
    contasReceber: z.boolean(),
    contasPagar: z.boolean(),
    faturamento: z.boolean(),
    estoque: z.boolean(),
    nfe: z.boolean(),
    sped: z.boolean(),
    spedPisCofins: z.boolean(),
    servico: z.boolean(),
    pacote: z.boolean(),
    movimentoBancario: z.boolean(),
    crediario: z.boolean(),
    nfce: z.boolean(),
    nfse: z.boolean(),
    ferramentasGestao: z.boolean(),
});

export const statusSchema = z.object({
    possuiCredito: z.boolean(),
    suspensoParado: z.boolean(),
    agenteVendas: z.boolean(),
    permiteVendaPrazo: z.boolean(),
    bloqueadoLiberacao: z.boolean(),
    contratoAssinado: z.boolean(),
    bloqueado: z.boolean(),
    recebimentoCarteira: z.boolean(),
    semRecebimento: z.boolean(),
    ajudaCusto: z.boolean(),
});

export const clientPayloadSchema = z.object({
    id: z.string().optional(),
    active: z.boolean().default(true),
    general: generalSchema,
    address: addressSchema,
    contract: contractSchema,
    modules: modulesSchema,
    status: statusSchema,
});

export {
    type ClientGeneralInfo,
    type ClientAddressInfo,
    type ClientContractInfo,
    type ClientModulesInfo,
    type ClientStatusInfo,
    type Client,
    defaultContractInfo,
    defaultModulesInfo,
    defaultStatusInfo
};
