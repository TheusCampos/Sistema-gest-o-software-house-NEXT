# 🔱 Sistema Zeus - Gestão Administrativa SoftHouse (v3.1)

O **Sistema Zeus** é uma plataforma SaaS (Software as a Service) de última geração, desenvolvida para centralizar a operação administrativa, técnica e financeira de uma SoftHouse moderna. Built with **Next.js 16**, **React 19** and **Tailwind CSS 4**.

---

## 🎯 Objetivo do Projeto
Oferecer uma visão de 360 graus da empresa, integrando gestão de contratos, suporte técnico (Tickets), inventário de ativos e performance comercial em um único ecossistema seguro e escalável.

---

## 🚀 Tecnologias e Stack Técnica (2026 Ready)
O sistema utiliza tecnologias de ponta para garantir performance extrema e segurança:

| Tecnologia | Descrição | Versão |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router + Server Components) | 16.1.6 |
| **Runtime** | React (com React Compiler) | 19.2.3 |
| **UI Engine** | Tailwind CSS (Engine v4 High Performance) | 4.0.0+ |
| **Data Logic** | Drizzle ORM + PostgreSQL (Neon/Local) | 0.45.1 |
| **State** | Zustand (Modular Stores) | 5.0.10 |
| **AI** | Google Gemini Pro (Integração Nativa) | Latest |
| **API Docs** | Swagger UI / OpenAPI 3.0 | 5.32.1 |

---

## 📦 Estrutura e Módulos Principais
O Zeus é construído de forma modular, permitindo que cada área da empresa tenha ferramentas dedicadas:

- **🔐 Autenticação & RBAC**: Controle granular de acessos por roles (Admin, Técnico, Vendedor).
- **👥 Gestão de Clientes**: CRM técnico com histórico de contratos, módulos e endereços.
- **📄 Contratos & Faturamento**: Controle de SLAs e módulos ativos para faturamento SaaS.
- **🎫 Tickets & SLA**: Sistema de chamados com checklists e prioridade dinâmica.
- **🖥️ Inventário (Hardware/VMs)**: Gestão de ativos físicos e instâncias virtuais.
- **📅 Agenda Técnica**: Sincronização de visitas técnicas vinculadas a chamados.

---

## 📂 Documentação Detalhada
Para facilitar a navegação técnica, o projeto possui documentos especializados em `/docs`:

1.  **[Visão Geral do Sistema](docs/visão_geral_sistema.md)**: Arquitetura profunda, segurança, fluxos de dados e infraestrutura.
2.  **[Guia de Detalhamento de Módulos](docs/MODULOS.md)**: O que cada módulo faz e quais stores/schemas utiliza.
3.  **[Manual de Contribuição](docs/CONTRIBUICAO.md)**: Padrões de código, Git flow, Design System e como adicionar novas features.
4.  **[Matriz de Permissões (RBAC)](docs/PERMISSOES.md)**: Detalhamento de quem pode acessar o quê.

---

## 🛠️ Início Rápido (Desenvolvimento)

1.  **Clone e Instale:**
    ```bash
    npm install
    ```

2.  **Variáveis de Ambiente:**
    Copie o `.env.example` para `.env` e preencha as chaves:
    - `DATABASE_URL` (PostgreSQL)
    - `AUTH_SECRET` (Gerada via `npx auth secret`)
    - `GEMINI_API_KEY` (Para automações de IA)

3.  **Rode o Sistema:**
    ```bash
    npm run dev
    ```
    Acesse: [http://localhost:3003](http://localhost:3003)

---

## 📦 Scripts de Utilidade
- `npm run dev`: Inicia o servidor com Webpack habilitado.
- `npm run build`: Pipeline de compilação otimizado para produção.
- `npm run lint`: Verificações de qualidade de código (ESLint 9).
- `npx tsx src/scripts/...`: Scripts de provimento de banco de dados e migrações rápidas.

---

## 🔒 Segurança em Primeiro Lugar
- **Sessões Securas**: Cookies `httpOnly` para evitar XSS.
- **Senhas Fortes**: Criptografia via Argon2.
- **Isolamento SaaS**: Filtro compulsório por `tenant_id` no nível do banco de dados/ORM.

---
*Atualizado em: 02 de Abril de 2026.*