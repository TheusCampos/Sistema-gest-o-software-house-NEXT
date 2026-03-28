/**
 * openapi-spec.ts
 * ─────────────────────────────────────────────────────────────────
 * Definição do spec OpenAPI 3.0 para todas as rotas públicas da API.
 *
 * REGRAS DE SEGURANÇA:
 *  - Não incluir: password, passwordHash, salt, tokens internos
 *  - /api/diagnostics é excluída intencionalmente (admin-only interno)
 *  - Schemas descrevem apenas o contrato público da API
 */

export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Sistema Zeus — API",
      version: "1.0.0",
      description:
        "Documentação interativa das rotas da API do Sistema Zeus. " +
        "Todas as rotas (exceto login) requerem uma sessão autenticada via cookie `zeus_session`.",
      contact: {
        name: "Equipe de Desenvolvimento",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004",
        description: "Servidor atual",
      },
    ],

    // ─── Segurança Global ───────────────────────────────────────────
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "zeus_session",
          description: "Cookie de sessão HttpOnly gerado após /api/login",
        },
      },

      // ─── Schemas (sem campos sensíveis) ──────────────────────────
      schemas: {
        // --- Auth ---
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@empresa.com" },
            password: { type: "string", minLength: 6, example: "••••••••" },
            remember: { type: "boolean", default: false },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/UserRole" },
            tenantId: { type: "string" },
          },
        },

        // --- Enums / Shared ---
        UserRole: {
          type: "string",
          enum: ["admin", "desenvolvedor", "vendedor", "suporte", "client", "technician"],
        },
        CRUDPermissions: {
          type: "object",
          properties: {
            view: { type: "boolean" },
            create: { type: "boolean" },
            edit: { type: "boolean" },
            delete: { type: "boolean" },
          },
        },
        UserPermissions: {
          type: "object",
          properties: {
            clients: { $ref: "#/components/schemas/CRUDPermissions" },
            contracts: { $ref: "#/components/schemas/CRUDPermissions" },
            tickets: { $ref: "#/components/schemas/CRUDPermissions" },
            settings: { $ref: "#/components/schemas/CRUDPermissions" },
            equipment: { $ref: "#/components/schemas/CRUDPermissions" },
            sellers: { $ref: "#/components/schemas/CRUDPermissions" },
            appointments: { $ref: "#/components/schemas/CRUDPermissions" },
            performance: { $ref: "#/components/schemas/CRUDPermissions" },
          },
        },

        // --- User (sem password) ---
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            tenantId: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/UserRole" },
            avatar: { type: "string", nullable: true },
            active: { type: "boolean" },
            permissions: { $ref: "#/components/schemas/UserPermissions" },
          },
        },
        UserCreate: {
          type: "object",
          required: ["name", "email", "role", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/UserRole" },
            password: { type: "string", minLength: 6, writeOnly: true },
            avatar: { type: "string", nullable: true },
            active: { type: "boolean", default: true },
            permissions: { $ref: "#/components/schemas/UserPermissions" },
          },
        },

        // --- Client ---
        ClientSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            active: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            general: {
              type: "object",
              properties: {
                razao: { type: "string" },
                fantasia: { type: "string", nullable: true },
                documento: { type: "string" },
                tipoPessoa: { type: "string", enum: ["Juridica", "Fisica"] },
                email: { type: "string" },
                telefone1: { type: "string", nullable: true },
              },
            },
            status: {
              type: "object",
              properties: {
                bloqueado: { type: "boolean" },
                suspensoParado: { type: "boolean" },
                contratoAssinado: { type: "boolean" },
              },
            },
          },
        },

        // --- Ticket ---
        TicketPriority: { type: "string", enum: ["Low", "Normal", "High", "Critical"] },
        TicketStatus: { type: "string", enum: ["Open", "Pending", "Resolved", "Closed"] },
        SupportTicket: {
          type: "object",
          properties: {
            id: { type: "string" },
            tenantId: { type: "string" },
            clientId: { type: "string" },
            clientName: { type: "string" },
            subject: { type: "string" },
            description: { type: "string", nullable: true },
            category: { type: "string" },
            serviceType: { type: "string" },
            priority: { $ref: "#/components/schemas/TicketPriority" },
            status: { $ref: "#/components/schemas/TicketStatus" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
            closedAt: { type: "string", nullable: true },
            solution: { type: "string", nullable: true },
            tasks: { type: "array", items: { type: "object" } },
            comments: { type: "array", items: { type: "object" } },
          },
        },

        // --- Contract ---
        Contract: {
          type: "object",
          properties: {
            id: { type: "string" },
            contractNumber: { type: "string" },
            clientId: { type: "string", nullable: true },
            clientName: { type: "string" },
            plan: { type: "string" },
            type: {
              type: "string",
              enum: ["Manutenção", "Locação", "Projeto Específico", "Licenciamento SaaS"],
            },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            mrr: { type: "string" },
            totalValue: { type: "string" },
            status: {
              type: "string",
              enum: ["Ativo", "Vencendo em Breve", "Atrasado", "Cancelado", "Em Renovação", "Vencido"],
            },
          },
        },

        // --- Equipment ---
        Equipment: {
          type: "object",
          properties: {
            id: { type: "string" },
            tenantId: { type: "string" },
            name: { type: "string" },
            type: { type: "string", enum: ["Desktop", "Server", "Notebook", "VM"] },
            status: { type: "string", enum: ["Ativo", "Inativo", "Em Manutenção", "Descartado"] },
            responsible: { type: "string" },
            registrationDate: { type: "string", format: "date" },
            active: { type: "boolean" },
          },
        },

        // --- Seller ---
        Seller: {
          type: "object",
          properties: {
            id: { type: "string" },
            tenantId: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            commissionImplementation: { type: "number" },
            commissionMonthly: { type: "number" },
            active: { type: "boolean" },
          },
        },

        // --- Appointment ---
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string" },
            tenantId: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            date: { type: "string", format: "date-time" },
            durationHours: { type: "number" },
            clientId: { type: "string", nullable: true },
            clientName: { type: "string", nullable: true },
            technicianId: { type: "string", nullable: true },
            technicianName: { type: "string", nullable: true },
            ticketId: { type: "string", nullable: true },
            type: { type: "string", enum: ["Remoto", "Presencial"] },
            status: {
              type: "string",
              enum: ["Pendente", "Confirmado", "Concluído", "Cancelado", "No-show"],
            },
            active: { type: "boolean" },
            location: { type: "string", nullable: true },
            createdAt: { type: "string" },
          },
        },

        // --- Erros Padrão ---
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            code: { type: "string", nullable: true },
          },
        },
      },
    },

    // ─── Segurança padrão (todas as rotas exceto login/logout) ─────
    security: [{ cookieAuth: [] }],

    // ─── Paths ─────────────────────────────────────────────────────
    paths: {
      // ── Auth ──────────────────────────────────────────────────────
      "/api/login": {
        post: {
          tags: ["Autenticação"],
          summary: "Realizar login",
          description: "Autentica o usuário e define o cookie de sessão `zeus_session`.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login bem-sucedido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            401: { description: "Credenciais inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/logout": {
        post: {
          tags: ["Autenticação"],
          summary: "Realizar logout",
          description: "Remove o cookie de sessão.",
          responses: {
            200: { description: "Logout realizado" },
          },
        },
      },

      // ── Clientes ─────────────────────────────────────────────────
      "/api/clients": {
        get: {
          tags: ["Clientes"],
          summary: "Listar clientes",
          description: "Retorna lista resumida dos clientes ativos do tenant.",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            200: {
              description: "Lista de clientes",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/ClientSummary" } },
                },
              },
            },
            401: { description: "Não autenticado" },
          },
        },
        post: {
          tags: ["Clientes"],
          summary: "Criar cliente",
          description: "Cria um novo cliente com transação completa (dados gerais, endereço, contrato, módulos e status).",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", description: "Payload completo do cliente" } } },
          },
          responses: {
            201: { description: "Cliente criado" },
            400: { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "Não autenticado" },
          },
        },
        put: {
          tags: ["Clientes"],
          summary: "Atualizar cliente",
          responses: {
            200: { description: "Cliente atualizado" },
            400: { description: "ID obrigatório" },
            401: { description: "Não autenticado" },
          },
        },
        delete: {
          tags: ["Clientes"],
          summary: "Desativar cliente (exclusão lógica)",
          parameters: [
            { name: "id", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Cliente desativado" },
            401: { description: "Não autenticado" },
          },
        },
      },
      "/api/clients/{id}": {
        get: {
          tags: ["Clientes"],
          summary: "Buscar detalhes completos do cliente",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Detalhes completos do cliente" },
            404: { description: "Cliente não encontrado" },
            401: { description: "Não autenticado" },
          },
        },
      },
      "/api/clients/{id}/liberacao": {
        patch: {
          tags: ["Clientes"],
          summary: "Alterar status de liberação de sistema do cliente",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    liberacao: { type: "boolean", description: "true para liberar, false para bloquear" }
                  },
                  required: ["liberacao"]
                }
              }
            }
          },
          responses: {
            200: { description: "Status de liberação alterado com sucesso" },
            400: { description: "Dados inválidos" },
            401: { description: "Não autenticado" },
            500: { description: "Erro interno" },
          },
        },
      },

      // ── Chamados ─────────────────────────────────────────────────
      "/api/tickets": {
        get: {
          tags: ["Chamados"],
          summary: "Listar chamados",
          responses: {
            200: {
              description: "Lista de chamados",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/SupportTicket" } },
                },
              },
            },
            401: { description: "Não autenticado" },
          },
        },
        post: {
          tags: ["Chamados"],
          summary: "Criar chamado",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SupportTicket" },
              },
            },
          },
          responses: {
            201: { description: "Chamado criado" },
            400: { description: "Campos obrigatórios faltando" },
          },
        },
        put: {
          tags: ["Chamados"],
          summary: "Atualizar chamado",
          responses: {
            200: { description: "Chamado atualizado" },
            404: { description: "Chamado não encontrado" },
          },
        },
      },
      "/api/tickets/unlock": {
        post: {
          tags: ["Chamados"],
          summary: "Desbloquear chamado arquivado",
          responses: {
            200: { description: "Chamado desbloqueado" },
            401: { description: "Não autenticado" },
          },
        },
      },

      // ── Usuários ─────────────────────────────────────────────────
      "/api/users": {
        get: {
          tags: ["Usuários"],
          summary: "Listar usuários do tenant",
          responses: {
            200: {
              description: "Lista de usuários (sem dados de senha)",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
                },
              },
            },
            401: { description: "Não autenticado" },
          },
        },
        post: {
          tags: ["Usuários"],
          summary: "Criar usuário",
          description: "Requer role admin ou desenvolvedor.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } },
            },
          },
          responses: {
            201: { description: "Usuário criado" },
            400: { description: "Dados inválidos" },
            403: { description: "Acesso negado" },
          },
        },
        put: {
          tags: ["Usuários"],
          summary: "Atualizar usuário",
          responses: {
            200: { description: "Usuário atualizado" },
            403: { description: "Acesso negado" },
          },
        },
        delete: {
          tags: ["Usuários"],
          summary: "Desativar usuário (exclusão lógica)",
          parameters: [
            { name: "id", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Usuário desativado" },
            403: { description: "Acesso negado" },
          },
        },
      },

      // ── Contratos ─────────────────────────────────────────────────
      "/api/contracts": {
        get: { tags: ["Contratos"], summary: "Listar contratos", responses: { 200: { description: "Lista de contratos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Contract" } } } } }, 401: { description: "Não autenticado" } } },
        post: { tags: ["Contratos"], summary: "Criar contrato", responses: { 201: { description: "Contrato criado" } } },
        put: { tags: ["Contratos"], summary: "Atualizar contrato", responses: { 200: { description: "Contrato atualizado" } } },
        delete: { tags: ["Contratos"], summary: "Excluir contrato", responses: { 200: { description: "Contrato excluído" } } },
      },

      // ── Equipamentos ──────────────────────────────────────────────
      "/api/equipment": {
        get: { tags: ["Equipamentos"], summary: "Listar equipamentos", responses: { 200: { description: "Lista de equipamentos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Equipment" } } } } } } },
        post: { tags: ["Equipamentos"], summary: "Criar equipamento", responses: { 201: { description: "Equipamento criado" } } },
        put: { tags: ["Equipamentos"], summary: "Atualizar equipamento", responses: { 200: { description: "Equipamento atualizado" } } },
        delete: { tags: ["Equipamentos"], summary: "Desativar equipamento", responses: { 200: { description: "Equipamento desativado" } } },
      },

      // ── Vendedores ────────────────────────────────────────────────
      "/api/sellers": {
        get: { tags: ["Vendedores"], summary: "Listar vendedores", responses: { 200: { description: "Lista de vendedores", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Seller" } } } } } } },
        post: { tags: ["Vendedores"], summary: "Criar vendedor", responses: { 201: { description: "Vendedor criado" } } },
        put: { tags: ["Vendedores"], summary: "Atualizar vendedor", responses: { 200: { description: "Vendedor atualizado" } } },
        delete: { tags: ["Vendedores"], summary: "Desativar vendedor", responses: { 200: { description: "Vendedor desativado" } } },
      },

      // ── Agendamentos ──────────────────────────────────────────────
      "/api/appointments": {
        get: { tags: ["Agendamentos"], summary: "Listar agendamentos", responses: { 200: { description: "Lista de agendamentos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Appointment" } } } } } } },
        post: { tags: ["Agendamentos"], summary: "Criar agendamento", responses: { 201: { description: "Agendamento criado" } } },
        put: { tags: ["Agendamentos"], summary: "Atualizar agendamento", responses: { 200: { description: "Agendamento atualizado" } } },
        delete: { tags: ["Agendamentos"], summary: "Cancelar agendamento", responses: { 200: { description: "Agendamento cancelado" } } },
      },

      // ── Templates ─────────────────────────────────────────────────
      "/api/templates": {
        get: { tags: ["Templates"], summary: "Listar templates de implantação", responses: { 200: { description: "Lista de templates" } } },
        post: { tags: ["Templates"], summary: "Criar template", responses: { 201: { description: "Template criado" } } },
        put: { tags: ["Templates"], summary: "Atualizar template", responses: { 200: { description: "Template atualizado" } } },
        delete: { tags: ["Templates"], summary: "Remover template", responses: { 200: { description: "Template removido" } } },
      },

      // ── Tipos de Serviço ──────────────────────────────────────────
      "/api/service-types": {
        get: { tags: ["Tipos de Serviço"], summary: "Listar tipos de serviço", responses: { 200: { description: "Lista de tipos de serviço" } } },
        post: { tags: ["Tipos de Serviço"], summary: "Criar tipo de serviço", responses: { 201: { description: "Tipo criado" } } },
        put: { tags: ["Tipos de Serviço"], summary: "Atualizar tipo de serviço", responses: { 200: { description: "Tipo atualizado" } } },
        delete: { tags: ["Tipos de Serviço"], summary: "Remover tipo de serviço", responses: { 200: { description: "Tipo removido" } } },
      },

      // ── Dashboard ─────────────────────────────────────────────────
      "/api/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Dados do painel principal",
          description: "Retorna métricas e KPIs do tenant autenticado.",
          responses: {
            200: { description: "Dados do dashboard" },
            401: { description: "Não autenticado" },
          },
        },
      },

      // NOTA: /api/diagnostics é excluída intencionalmente.
      // É uma rota admin-only interna e não deve aparecer na documentação pública.
      // NOTA: /api/register é excluída — usada apenas no onboarding inicial.
    },
  };
}
