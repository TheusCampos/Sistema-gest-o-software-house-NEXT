import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientPayloadSchema
} from "@/schemas/client.schema";

export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/api-wrapper";

// GET /api/clients — listagem resumida
export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '5000', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const tenantIdParam = searchParams.get('tenantId') || 'default';
  const allTenants = searchParams.get('allTenants') === 'true';

  const result = await db.execute(sql`
      SELECT
        c.id, c.active, c.created_at,
        g.razao, g.fantasia, g.documento, g.tipo_pessoa, g.email, g.tel as telefone_1,
        s.bloqueado, s.suspenso_parado, s.contrato_assinado,
        a.logradouro, a.numero, a.bairro, a.cidade, a.uf, a.cep
      FROM clients c
      LEFT JOIN client_general_info  g ON g.tenant_id = c.tenant_id AND g.client_id = c.id
      LEFT JOIN client_status_info   s ON s.tenant_id = c.tenant_id AND s.client_id = c.id
      LEFT JOIN client_address_info  a ON a.tenant_id = c.tenant_id AND a.client_id = c.id
      WHERE (c.tenant_id = ${tenantIdParam} OR ${allTenants})
      ORDER BY g.razao
      LIMIT ${limit} OFFSET ${offset}
    `);

  // Respective mapping from Database back to generalized subset for table (Type inferred by usage on page)
  interface ClientRow {
    id: string;
    active: boolean;
    created_at: string;
    razao: string;
    fantasia: string;
    documento: string;
    tipo_pessoa: string;
    email: string;
    telefone_1: string;
    bloqueado: boolean;
    suspenso_parado: boolean;
    contrato_assinado: boolean;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  }

  const clients = (result.rows as unknown as ClientRow[]).map((row) => ({
    id: row.id,
    active: row.active,
    createdAt: row.created_at,
    general: {
      razao: row.razao,
      fantasia: row.fantasia,
      documento: row.documento,
      tipoPessoa: row.tipo_pessoa,
      email: row.email,
      telefone1: row.telefone_1,
    },
    status: {
      bloqueado: row.bloqueado,
      suspensoParado: row.suspenso_parado,
      contratoAssinado: row.contrato_assinado,
    },
    address: {
      logradouro: row.logradouro,
      numero: row.numero,
      bairro: row.bairro,
      cidade: row.cidade,
      uf: row.uf,
      cep: row.cep,
    }
  }));

  return NextResponse.json(clients, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
});
// POST /api/clients — transação completa
export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const parsedData = clientPayloadSchema.parse(body);

  try {
    const newClient = await db.transaction(async (tx) => {
      // 1. Inserir registro raiz
      const insertClientResult = await tx.execute(sql`
          INSERT INTO clients (tenant_id, active)
          VALUES (${session.tenantId}, ${parsedData.active})
          RETURNING id
        `);
      const clientId = String(insertClientResult.rows[0].id);

      // 2. Dados gerais
      await tx.execute(sql`
          INSERT INTO client_general_info (
            tenant_id, client_id, razao, fantasia, tipo_pessoa, documento, cnpj,
            inscricao_estadual_rg, data_abertura, email, tel, cel,
            home_page, resp, observacao, server_id
          ) VALUES (
            ${session.tenantId}, ${clientId}, ${parsedData.general.razao}, ${parsedData.general.fantasia || ''},
            ${parsedData.general.tipoPessoa}, ${parsedData.general.documento}, ${parsedData.general.documento}, ${parsedData.general.inscricaoEstadualRg || null},
            ${parsedData.general.dataAbertura ? new Date(parsedData.general.dataAbertura).toISOString() : null}, ${parsedData.general.email || ''},
            ${parsedData.general.telefone1 || ''}, ${parsedData.general.telefone2 || ''}, ${parsedData.general.homePage || null},
            ${parsedData.general.contatoResponsavel || ''}, ${parsedData.general.observacao || null}, ${parsedData.general.serverId || null}
          )
        `);

      // 3. Endereço
      await tx.execute(sql`
          INSERT INTO client_address_info (
            tenant_id, client_id, logradouro, numero, complemento, bairro, cidade, uf, cep
          ) VALUES (
            ${session.tenantId}, ${clientId}, ${parsedData.address.logradouro}, ${parsedData.address.numero},
            ${parsedData.address.complemento || null}, ${parsedData.address.bairro}, ${parsedData.address.cidade},
            ${parsedData.address.uf}, ${parsedData.address.cep}
          )
        `);

      // 4. Contrato
      await tx.execute(sql`
          INSERT INTO client_contract_info (
            tenant_id, client_id, valor_implantacao, valor_mensal, percentual_comissao,
            dia_vencimento, mes_ajuste, percentual_ajuste, terminais, data_implantacao,
            inicio_mensal, liberacao
          ) VALUES (
            ${session.tenantId}, ${clientId}, ${parsedData.contract.valorImplantacao || null},
            ${parsedData.contract.valorMensal || null}, ${parsedData.contract.percentualComissao || null},
            ${parsedData.contract.diaVencimento || null}, ${parsedData.contract.mesAjuste || null},
            ${parsedData.contract.percentualAjuste || null}, ${parsedData.contract.terminais || 1},
            ${parsedData.contract.dataImplantacao ? new Date(parsedData.contract.dataImplantacao).toISOString() : null},
            ${parsedData.contract.inicioMensal ? new Date(parsedData.contract.inicioMensal).toISOString() : null},
            ${parsedData.contract.liberacao}
          )
        `);

      // 5. Módulos
      await tx.execute(sql`
          INSERT INTO client_modules_info (
            tenant_id, client_id, contas_receber, contas_pagar, faturamento, estoque, nfe, sped,
            sped_pis_cofins, servico, pacote, movimento_bancario, crediario, nfce, nfse, ferramentas_gestao
          ) VALUES (
            ${session.tenantId}, ${clientId}, ${parsedData.modules.contasReceber}, ${parsedData.modules.contasPagar},
            ${parsedData.modules.faturamento}, ${parsedData.modules.estoque}, ${parsedData.modules.nfe},
            ${parsedData.modules.sped}, ${parsedData.modules.spedPisCofins}, ${parsedData.modules.servico},
            ${parsedData.modules.pacote}, ${parsedData.modules.movimentoBancario}, ${parsedData.modules.crediario},
            ${parsedData.modules.nfce}, ${parsedData.modules.nfse}, ${parsedData.modules.ferramentasGestao}
          )
        `);

      // 6. Status
      await tx.execute(sql`
          INSERT INTO client_status_info (
            tenant_id, client_id, possui_credito, suspenso_parado, agente_vendas, permite_venda_prazo,
            bloqueado_liberacao, contrato_assinado, bloqueado, recebimento_carteira, sem_recebimento, ajuda_custo
          ) VALUES (
            ${session.tenantId}, ${clientId}, ${parsedData.status.possuiCredito}, ${parsedData.status.suspensoParado},
            ${parsedData.status.agenteVendas}, ${parsedData.status.permiteVendaPrazo}, ${parsedData.status.bloqueadoLiberacao},
            ${parsedData.status.contratoAssinado}, ${parsedData.status.bloqueado}, ${parsedData.status.recebimentoCarteira},
            ${parsedData.status.semRecebimento}, ${parsedData.status.ajudaCusto}
          )
        `);

      return {
        id: clientId,
        ...parsedData
      };
    });

    return NextResponse.json(newClient, { status: 201 });
    } catch (error: unknown) {
    const err = error as { detail?: string; hint?: string; message?: string };
    console.error("CRITICAL CLIENT SAVE ERROR:", error);
    const pgDetail = err.detail || "";
    const pgHint = err.hint || "";
    const message = err.message || "Erro desconhecido";
    
    return NextResponse.json({ 
        message: "Erro no banco ao salvar cliente: " + message, 
        detail: pgDetail,
        hint: pgHint
    }, { status: 500 });
  }
});

// PUT /api/clients — atualização completa
export const PUT = withAuth(async (request, session) => {
  const body = await request.json();
  const parsedData = clientPayloadSchema.parse(body);

  if (!parsedData.id) {
    return NextResponse.json({ message: "ID é obrigatório para atualização." }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
    // 1. Update Root
    await tx.execute(sql`
        UPDATE clients 
        SET active = ${parsedData.active}, updated_at = NOW()
        WHERE id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);

    // 2. Update General
    await tx.execute(sql`
        UPDATE client_general_info SET
          razao = ${parsedData.general.razao}, fantasia = ${parsedData.general.fantasia || ''},
          tipo_pessoa = ${parsedData.general.tipoPessoa}, documento = ${parsedData.general.documento},
          cnpj = ${parsedData.general.documento}, inscricao_estadual_rg = ${parsedData.general.inscricaoEstadualRg || null},
          data_abertura = ${parsedData.general.dataAbertura ? new Date(parsedData.general.dataAbertura).toISOString() : null},
          email = ${parsedData.general.email || ''}, tel = ${parsedData.general.telefone1 || ''},
          cel = ${parsedData.general.telefone2 || ''}, home_page = ${parsedData.general.homePage || null},
          resp = ${parsedData.general.contatoResponsavel || ''},
          observacao = ${parsedData.general.observacao || null},
          server_id = ${parsedData.general.serverId || null}
        WHERE client_id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);

    // 3. Update Address
    await tx.execute(sql`
        UPDATE client_address_info SET
          logradouro = ${parsedData.address.logradouro}, numero = ${parsedData.address.numero},
          complemento = ${parsedData.address.complemento || null}, bairro = ${parsedData.address.bairro},
          cidade = ${parsedData.address.cidade}, uf = ${parsedData.address.uf}, cep = ${parsedData.address.cep}
        WHERE client_id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);

    // 4. Update Contract
    await tx.execute(sql`
        UPDATE client_contract_info SET
          valor_implantacao = ${parsedData.contract.valorImplantacao || null}, valor_mensal = ${parsedData.contract.valorMensal || null},
          percentual_comissao = ${parsedData.contract.percentualComissao || null}, dia_vencimento = ${parsedData.contract.diaVencimento || null},
          mes_ajuste = ${parsedData.contract.mesAjuste || null}, percentual_ajuste = ${parsedData.contract.percentualAjuste || null},
          terminais = ${parsedData.contract.terminais || 1}, data_implantacao = ${parsedData.contract.dataImplantacao ? new Date(parsedData.contract.dataImplantacao).toISOString() : null},
          inicio_mensal = ${parsedData.contract.inicioMensal ? new Date(parsedData.contract.inicioMensal).toISOString() : null},
          liberacao = ${parsedData.contract.liberacao}, updated_at = NOW()
        WHERE client_id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);

    // 5. Update Modules
    await tx.execute(sql`
        UPDATE client_modules_info SET
          contas_receber = ${parsedData.modules.contasReceber}, contas_pagar = ${parsedData.modules.contasPagar},
          faturamento = ${parsedData.modules.faturamento}, estoque = ${parsedData.modules.estoque},
          nfe = ${parsedData.modules.nfe}, sped = ${parsedData.modules.sped},
          sped_pis_cofins = ${parsedData.modules.spedPisCofins}, servico = ${parsedData.modules.servico},
          pacote = ${parsedData.modules.pacote}, movimento_bancario = ${parsedData.modules.movimentoBancario},
          crediario = ${parsedData.modules.crediario}, nfce = ${parsedData.modules.nfce},
          nfse = ${parsedData.modules.nfse}, ferramentas_gestao = ${parsedData.modules.ferramentasGestao},
          updated_at = NOW()
        WHERE client_id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);

    await tx.execute(sql`
        UPDATE client_status_info SET
          possui_credito = ${parsedData.status.possuiCredito}, suspenso_parado = ${parsedData.status.suspensoParado},
          agente_vendas = ${parsedData.status.agenteVendas}, permite_venda_prazo = ${parsedData.status.permiteVendaPrazo},
          bloqueado_liberacao = ${parsedData.status.bloqueadoLiberacao}, contrato_assinado = ${parsedData.status.contratoAssinado},
          bloqueado = ${parsedData.status.bloqueado}, recebimento_carteira = ${parsedData.status.recebimentoCarteira},
          sem_recebimento = ${parsedData.status.semRecebimento}, ajuda_custo = ${parsedData.status.ajudaCusto},
          updated_at = NOW()
        WHERE client_id = ${parsedData.id} AND tenant_id = ${session.tenantId}
      `);
    });

    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    const err = error as { detail?: string; hint?: string; message?: string };
    console.error("CRITICAL CLIENT UPDATE ERROR:", error);
    const pgDetail = err.detail || "";
    const pgHint = err.hint || "";
    const message = err.message || "Erro desconhecido";
    
    return NextResponse.json({ 
        message: "Erro no banco ao atualizar cliente: " + message, 
        detail: pgDetail,
        hint: pgHint
    }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request, session) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
  }

  await db.execute(sql`
      UPDATE clients SET
        active = false,
        updated_at = NOW()
      WHERE id = ${id} AND tenant_id = ${session.tenantId}
    `);

  return NextResponse.json({ id, active: false });
});
