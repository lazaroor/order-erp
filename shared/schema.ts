import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const StatusPedido = {
  EmProducao: 1,
  Enviado: 2,
  Concluido: 3,
  Cancelado: 4
} as const;

export const TipoLancamento = {
  Entrada: 1,
  Saida: 2
} as const;

// Tables
export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey(),
  nome: text("nome").notNull(),
  precoVenda: real("preco_venda").notNull(),
  custoUnitario: real("custo_unitario").notNull(),
  ativo: integer("ativo", { mode: 'boolean' }).notNull().default(true),
});

export const pedidos = sqliteTable("pedidos", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  numero: text("numero").notNull().unique(),
  clienteNome: text("cliente_nome"),
  status: integer("status").notNull().default(StatusPedido.EmProducao),
  codigoRastreio: text("codigo_rastreio"),
  custoFrete: real("custo_frete").default(0),
  criadoEm: text("criado_em").notNull().default(sql`(datetime('now'))`),
  atualizadoEm: text("atualizado_em").notNull().default(sql`(datetime('now'))`),
});

export const itensPedido = sqliteTable("itens_pedido", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  pedidoId: text("pedido_id").notNull().references(() => pedidos.id),
  produtoId: integer("produto_id").notNull().references(() => produtos.id),
  quantidade: real("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
});

export const lancamentosCaixa = sqliteTable("lancamentos_caixa", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  tipo: integer("tipo").notNull(),
  categoria: text("categoria").notNull(),
  valor: real("valor").notNull(),
  data: text("data").notNull().default(sql`(datetime('now'))`),
  pedidoId: text("pedido_id").references(() => pedidos.id),
});

// Insert Schemas
export const insertProdutoSchema = createInsertSchema(produtos).omit({
  id: true,
});

export const insertPedidoSchema = createInsertSchema(pedidos).omit({
  id: true,
  numero: true,
  criadoEm: true,
  atualizadoEm: true,
}).extend({
  itens: z.array(z.object({
    produtoId: z.number().min(1),
    quantidade: z.number().min(0.01),
    precoUnitario: z.number().min(0).optional(),
  })),
});

export const insertItemPedidoSchema = createInsertSchema(itensPedido).omit({
  id: true,
});

export const insertLancamentoCaixaSchema = createInsertSchema(lancamentosCaixa).omit({
  id: true,
  data: true,
}).extend({
  data: z.string().optional(),
});

// Types
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtos.$inferSelect;

export type InsertPedido = z.infer<typeof insertPedidoSchema>;
export type Pedido = typeof pedidos.$inferSelect;

export type InsertItemPedido = z.infer<typeof insertItemPedidoSchema>;
export type ItemPedido = typeof itensPedido.$inferSelect;

export type InsertLancamentoCaixa = z.infer<typeof insertLancamentoCaixaSchema>;
export type LancamentoCaixa = typeof lancamentosCaixa.$inferSelect;

// API Response Types
export type PedidoComItens = Pedido & {
  itens: (ItemPedido & { produto: Produto })[];
};

export type ResumoCaixa = {
  entradas: number;
  saidas: number;
  saldo: number;
};
