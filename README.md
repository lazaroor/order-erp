# Sistema de Controle de Pedidos e Fluxo de Caixa

Sistema completo para gerenciamento de pedidos e controle financeiro desenvolvido com Node.js, React e Supabase (PostgreSQL).

## Funcionalidades

- **Gestão de Pedidos**: Criação e controle de status de pedidos (Em Produção → Enviado → Concluído)
- **Produtos Fixos**: SUPORTE_PEQUENO (R$ 20,00) e SUPORTE_GRANDE (R$ 35,00)
- **Fluxo de Caixa**: Controle automático de entradas e saídas
- **Lançamentos Manuais**: Registro de despesas e receitas diversas
- **Relatórios**: Resumos financeiros por período

## Tecnologias

- **Backend**: Node.js, Express.js
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **UI**: Shadcn/ui components

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Defina as variáveis de ambiente:
   - `SUPABASE_URL`: URL do projeto Supabase
   - `SUPABASE_KEY`: API key do projeto
3. Crie as tabelas `produtos`, `pedidos`, `itens_pedido`, `lancamentos_caixa` e `usuarios` com os campos utilizados no projeto (mesma estrutura do antigo banco SQLite).

## Instalação e Execução

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```
