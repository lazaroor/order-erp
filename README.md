# Sistema de Controle de Pedidos e Fluxo de Caixa

Sistema completo para gerenciamento de pedidos e controle financeiro desenvolvido com Node.js, React e SQLite.

## Funcionalidades

- **Gestão de Pedidos**: Criação e controle de status de pedidos (Em Produção → Enviado → Concluído)
- **Produtos Fixos**: SUPORTE_PEQUENO (R$ 20,00) e SUPORTE_GRANDE (R$ 35,00)
- **Fluxo de Caixa**: Controle automático de entradas e saídas
- **Lançamentos Manuais**: Registro de despesas e receitas diversas
- **Relatórios**: Resumos financeiros por período

## Tecnologias

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: SQLite com schema Drizzle ORM
- **UI**: Shadcn/ui components

## Instalação e Execução

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
