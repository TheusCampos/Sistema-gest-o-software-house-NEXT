import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { withAuth, ApiContext } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, session, { params }: ApiContext<{ id: string }>) => {
    const idValue = (await params).id;
    const result = await db.execute(sql`
      SELECT
        c.id, c.tenant_id, c.active, c.created_at,
        g.razao, g.fantasia, g.tipo_pessoa, g.documento, g.inscricao_estadual_rg,
        g.data_abertura, g.email, g.tel as telefone_1, g.cel as telefone_2, g.home_page, g.resp as contato_responsavel,
        g.observacao, g.server_id,
        a.logradouro, a.numero, a.complemento, a.bairro, a.cidade, a.uf, a.cep,
        ct.valor_implantacao, ct.valor_mensal, ct.percentual_comissao, ct.dia_vencimento,
        ct.mes_ajuste, ct.percentual_ajuste, ct.terminais, ct.data_implantacao, ct.inicio_mensal, ct.liberacao,
        m.contas_receber, m.contas_pagar, m.faturamento, m.estoque, m.nfe, m.sped, m.sped_pis_cofins, m.servico,
        m.pacote, m.movimento_bancario, m.crediario, m.nfce, m.nfse, m.ferramentas_gestao,
        s.possui_credito, s.suspenso_parado, s.agente_vendas, s.permite_venda_prazo, s.bloqueado_liberacao,
        s.contrato_assinado, s.bloqueado, s.recebimento_carteira, s.sem_recebimento, s.ajuda_custo
      FROM clients c
      LEFT JOIN client_general_info  g  ON g.tenant_id  = c.tenant_id AND g.client_id  = c.id
      LEFT JOIN client_address_info  a  ON a.tenant_id  = c.tenant_id AND a.client_id  = c.id
      LEFT JOIN client_contract_info ct ON ct.tenant_id = c.tenant_id AND ct.client_id = c.id
      LEFT JOIN client_modules_info  m  ON m.tenant_id  = c.tenant_id AND m.client_id  = c.id
      LEFT JOIN client_status_info   s  ON s.tenant_id  = c.tenant_id AND s.client_id  = c.id
      WHERE c.tenant_id = ${session.tenantId} AND c.id = ${idValue}
    `);

    if (!result.rows.length) {
        return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });
    }

    interface ClientDbRow {
        id: string; tenant_id: string; active: boolean; created_at: string;
        razao: string; fantasia: string; tipo_pessoa: 'Juridica' | 'Fisica'; documento: string;
        inscricao_estadual_rg: string; data_abertura: string | null; email: string;
        telefone_1: string; telefone_2: string; home_page: string; contato_responsavel: string;
        observacao: string; server_id: string;
        logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string;
        valor_implantacao: string | number; valor_mensal: string | number;
        percentual_comissao: string | number; dia_vencimento: number;
        mes_ajuste: string; percentual_ajuste: string | number; terminais: number;
        data_implantacao: string | null; inicio_mensal: string | null; liberacao: boolean;
        contas_receber: boolean; contas_pagar: boolean; faturamento: boolean; estoque: boolean;
        nfe: boolean; sped: boolean; sped_pis_cofins: boolean; servico: boolean;
        pacote: boolean; movimento_bancario: boolean; crediario: boolean;
        nfce: boolean; nfse: boolean; ferramentas_gestao: boolean;
        possui_credito: boolean; suspenso_parado: boolean; agente_vendas: boolean;
        permite_venda_prazo: boolean; bloqueado_liberacao: boolean; contrato_assinado: boolean;
        bloqueado: boolean; recebimento_carteira: boolean; sem_recebimento: boolean; ajuda_custo: boolean;
    }
    const row = result.rows[0] as unknown as ClientDbRow;

    // Helper para converter datas de forma segura
    const formatDate = (dateStr: string | null) => 
        dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;

    const client = {
        id: row.id,
        tenantId: row.tenant_id,
        active: row.active,
        createdAt: row.created_at,
        general: {
            razao: row.razao,
            fantasia: row.fantasia,
            tipoPessoa: row.tipo_pessoa,
            documento: row.documento,
            inscricaoEstadualRg: row.inscricao_estadual_rg,
            dataAbertura: formatDate(row.data_abertura),
            email: row.email,
            telefone1: row.telefone_1,
            telefone2: row.telefone_2,
            homePage: row.home_page,
            contatoResponsavel: row.contato_responsavel,
            observacao: row.observacao,
            serverId: row.server_id,
        },
        address: {
            logradouro: row.logradouro,
            numero: row.numero,
            complemento: row.complemento,
            bairro: row.bairro,
            cidade: row.cidade,
            uf: row.uf,
            cep: row.cep,
        },
        contract: {
            valorImplantacao: row.valor_implantacao ? Number(row.valor_implantacao) : undefined,
            valorMensal: row.valor_mensal ? Number(row.valor_mensal) : undefined,
            percentualComissao: row.percentual_comissao ? Number(row.percentual_comissao) : undefined,
            diaVencimento: row.dia_vencimento,
            mesAjuste: row.mes_ajuste,
            percentualAjuste: row.percentual_ajuste ? Number(row.percentual_ajuste) : undefined,
            terminais: row.terminais,
            dataImplantacao: formatDate(row.data_implantacao),
            inicioMensal: formatDate(row.inicio_mensal),
            liberacao: row.liberacao,
        },
        modules: {
            contasReceber: row.contas_receber,
            contasPagar: row.contas_pagar,
            faturamento: row.faturamento,
            estoque: row.estoque,
            nfe: row.nfe,
            sped: row.sped,
            spedPisCofins: row.sped_pis_cofins,
            servico: row.servico,
            pacote: row.pacote,
            movimento_bancario: row.movimento_bancario,
            crediario: row.crediario,
            nfce: row.nfce,
            nfse: row.nfse,
            ferramentas_gestao: row.ferramentas_gestao,
        },
        status: {
            possuiCredito: row.possui_credito,
            suspensoParado: row.suspenso_parado,
            agenteVendas: row.agente_vendas,
            permiteVendaPrazo: row.permite_venda_prazo,
            bloqueadoLiberacao: row.bloqueado_liberacao,
            contratoAssinado: row.contrato_assinado,
            bloqueado: row.bloqueado,
            recebimentoCarteira: row.recebimento_carteira,
            semRecebimento: row.sem_recebimento,
            ajuda_custo: row.ajuda_custo,
        }
    };

    return NextResponse.json(client);
});
