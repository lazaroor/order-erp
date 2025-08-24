import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  produtos, 
  pedidos, 
  itensPedido, 
  lancamentosCaixa,
  StatusPedido,
  TipoLancamento,
  type Produto,
  type Pedido,
  type ItemPedido,
  type LancamentoCaixa,
  type PedidoComItens,
  type ResumoCaixa,
  type InsertProduto,
  type InsertPedido,
  type InsertLancamentoCaixa
} from "@shared/schema";
import path from 'path';
import fs from 'fs';

export interface IStorage {
  // Produtos
  getProdutos(): Promise<Produto[]>;
  getProduto(id: number): Promise<Produto | undefined>;
  createProduto(produto: InsertProduto): Promise<Produto>;
  updateProduto(id: number, produto: InsertProduto): Promise<Produto | undefined>;
  
  // Pedidos
  getPedidos(status?: number, start?: string, end?: string): Promise<PedidoComItens[]>;
  getPedido(id: string): Promise<PedidoComItens | undefined>;
  createPedido(pedido: InsertPedido): Promise<PedidoComItens>;
  updatePedidoStatus(id: string, novoStatus: number, codigoRastreio?: string, custoFrete?: number): Promise<PedidoComItens | undefined>;
  
  // Caixa
  getLancamentosCaixa(start?: string, end?: string): Promise<LancamentoCaixa[]>;
  createLancamentoCaixa(lancamento: InsertLancamentoCaixa): Promise<LancamentoCaixa>;
  getResumoCaixa(start?: string, end?: string): Promise<ResumoCaixa>;
}

class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private drizzle: ReturnType<typeof drizzle>;

  constructor() {
    // Ensure App_Data directory exists
    const appDataDir = path.join(process.cwd(), 'App_Data');
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }

    const dbPath = path.join(appDataDir, 'pedidos.db');
    this.db = new Database(dbPath);
    this.drizzle = drizzle(this.db);

    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        preco_venda REAL NOT NULL,
        custo_unitario REAL NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        numero TEXT NOT NULL UNIQUE,
        cliente_nome TEXT,
        status INTEGER NOT NULL DEFAULT 1,
        codigo_rastreio TEXT,
        custo_frete REAL DEFAULT 0,
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS itens_pedido (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        pedido_id TEXT NOT NULL REFERENCES pedidos(id),
        produto_id INTEGER NOT NULL REFERENCES produtos(id),
        quantidade REAL NOT NULL,
        preco_unitario REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lancamentos_caixa (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        tipo INTEGER NOT NULL,
        categoria TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL DEFAULT (datetime('now')),
        pedido_id TEXT REFERENCES pedidos(id)
      );
    `);

    // Seed produtos
    const produtoExists = this.db.prepare('SELECT COUNT(*) as count FROM produtos').get() as { count: number };
    if (produtoExists.count === 0) {
      this.db.exec(`
        INSERT INTO produtos (id, nome, preco_venda, custo_unitario, ativo) VALUES
        (1, 'SUPORTE_PEQUENO', 20.00, 8.00, 1),
        (2, 'SUPORTE_GRANDE', 35.00, 15.00, 1);
      `);
    }
  }

  async getProdutos(): Promise<Produto[]> {
    return this.drizzle.select().from(produtos).where(eq(produtos.ativo, true)).all();
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    const result = this.drizzle.select().from(produtos).where(eq(produtos.id, id)).get();
    return result || undefined;
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    // Get the next ID
    const maxId = this.db.prepare('SELECT MAX(id) as maxId FROM produtos').get() as { maxId: number | null };
    const nextId = (maxId?.maxId || 0) + 1;

    this.drizzle.insert(produtos).values({
      id: nextId,
      nome: insertProduto.nome,
      precoVenda: insertProduto.precoVenda,
      custoUnitario: insertProduto.custoUnitario,
      ativo: insertProduto.ativo ?? true,
    }).run();

    const result = this.drizzle.select().from(produtos).where(eq(produtos.id, nextId)).get();
    return result!;
  }

  async updateProduto(id: number, insertProduto: InsertProduto): Promise<Produto | undefined> {
    const existing = await this.getProduto(id);
    if (!existing) return undefined;

    this.drizzle
      .update(produtos)
      .set({
        nome: insertProduto.nome,
        precoVenda: insertProduto.precoVenda,
        custoUnitario: insertProduto.custoUnitario,
        ativo: insertProduto.ativo ?? true,
      })
      .where(eq(produtos.id, id))
      .run();

    return await this.getProduto(id);
  }

  async getPedidos(status?: number, start?: string, end?: string): Promise<PedidoComItens[]> {
    const conditions = [];
    if (status) conditions.push(eq(pedidos.status, status));
    if (start) conditions.push(gte(pedidos.criadoEm, start));
    if (end) conditions.push(lte(pedidos.criadoEm, end));

    let query = this.drizzle
      .select({
        pedido: pedidos,
        item: itensPedido,
        produto: produtos
      })
      .from(pedidos)
      .leftJoin(itensPedido, eq(pedidos.id, itensPedido.pedidoId))
      .leftJoin(produtos, eq(itensPedido.produtoId, produtos.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = query.orderBy(desc(pedidos.criadoEm)).all();

    // Group by pedido
    const pedidosMap = new Map<string, PedidoComItens>();
    
    for (const row of results) {
      if (!pedidosMap.has(row.pedido.id)) {
        pedidosMap.set(row.pedido.id, {
          ...row.pedido,
          itens: []
        });
      }
      
      if (row.item && row.produto) {
        pedidosMap.get(row.pedido.id)!.itens.push({
          ...row.item,
          produto: row.produto
        });
      }
    }

    return Array.from(pedidosMap.values());
  }

  async getPedido(id: string): Promise<PedidoComItens | undefined> {
    const results = this.drizzle
      .select({
        pedido: pedidos,
        item: itensPedido,
        produto: produtos
      })
      .from(pedidos)
      .leftJoin(itensPedido, eq(pedidos.id, itensPedido.pedidoId))
      .leftJoin(produtos, eq(itensPedido.produtoId, produtos.id))
      .where(eq(pedidos.id, id))
      .all();

    if (results.length === 0) return undefined;

    const pedido: PedidoComItens = {
      ...results[0].pedido,
      itens: []
    };

    for (const row of results) {
      if (row.item && row.produto) {
        pedido.itens.push({
          ...row.item,
          produto: row.produto
        });
      }
    }

    return pedido;
  }

  async createPedido(insertPedido: InsertPedido): Promise<PedidoComItens> {
    const { generateOrderNumber } = await import('./services/numberService');
    
    const numero = await generateOrderNumber();
    const pedidoId = `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.db.transaction(() => {
      // Insert pedido
      this.drizzle.insert(pedidos).values({
        id: pedidoId,
        numero,
        clienteNome: insertPedido.clienteNome,
        status: StatusPedido.EmProducao,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }).run();

      // Insert itens
      let custoTotalProducao = 0;
      for (const item of insertPedido.itens) {
        const produto = this.drizzle.select().from(produtos).where(eq(produtos.id, item.produtoId)).get();
        if (!produto) throw new Error(`Produto ${item.produtoId} não encontrado`);

        const precoUnitario = item.precoUnitario && item.precoUnitario > 0 ? item.precoUnitario : produto.precoVenda;
        custoTotalProducao += item.quantidade * produto.custoUnitario;

        this.drizzle.insert(itensPedido).values({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pedidoId,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario,
        }).run();
      }

      // Criar lançamento de custo de produção
      if (custoTotalProducao > 0) {
        this.drizzle.insert(lancamentosCaixa).values({
          id: `lanc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tipo: TipoLancamento.Saida,
          categoria: 'Custo de Produção',
          valor: custoTotalProducao,
          data: new Date().toISOString(),
          pedidoId: pedidoId,
        }).run();
      }
    })();

    const result = await this.getPedido(pedidoId);
    if (!result) throw new Error('Erro ao criar pedido');
    return result;
  }

  async updatePedidoStatus(id: string, novoStatus: number, codigoRastreio?: string, custoFrete?: number): Promise<PedidoComItens | undefined> {
    const pedidoAtual = await this.getPedido(id);
    if (!pedidoAtual) return undefined;

    // Validate status transition
    if (pedidoAtual.status === StatusPedido.Concluido && novoStatus !== StatusPedido.Concluido) {
      throw new Error('Não é possível alterar status de pedido concluído');
    }

    this.db.transaction(() => {
      // Update pedido status
      const updateData: any = { 
        status: novoStatus, 
        atualizadoEm: new Date().toISOString() 
      };
      
      if (codigoRastreio !== undefined) {
        updateData.codigoRastreio = codigoRastreio;
      }
      if (custoFrete !== undefined) {
        updateData.custoFrete = custoFrete;
      }

      this.drizzle
        .update(pedidos)
        .set(updateData)
        .where(eq(pedidos.id, id))
        .run();

      // Se mudando para Enviado, criar lançamento do frete
      if (novoStatus === StatusPedido.Enviado && custoFrete && custoFrete > 0) {
        this.drizzle.insert(lancamentosCaixa).values({
          id: `lanc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tipo: TipoLancamento.Saida,
          categoria: 'Frete',
          valor: custoFrete,
          data: new Date().toISOString(),
          pedidoId: id,
        }).run();
      }

      // If completing order, create entry for revenue
      if (novoStatus === StatusPedido.Concluido) {
        const valorVenda = pedidoAtual.itens.reduce(
          (sum, item) => sum + (item.quantidade * item.precoUnitario), 0
        );

        // Entrada - Receita da Venda (o custo já foi lançado na criação do pedido)
        this.drizzle.insert(lancamentosCaixa).values({
          id: `lanc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tipo: TipoLancamento.Entrada,
          categoria: 'Receita de Venda',
          valor: valorVenda,
          data: new Date().toISOString(),
          pedidoId: id,
        }).run();
      }
    })();

    return await this.getPedido(id);
  }

  async getLancamentosCaixa(start?: string, end?: string): Promise<LancamentoCaixa[]> {
    const conditions = [];
    if (start) conditions.push(gte(lancamentosCaixa.data, start));
    if (end) conditions.push(lte(lancamentosCaixa.data, end));

    let query = this.drizzle.select().from(lancamentosCaixa);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(lancamentosCaixa.data)).all();
  }

  async createLancamentoCaixa(lancamento: InsertLancamentoCaixa): Promise<LancamentoCaixa> {
    const id = `lanc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.drizzle.insert(lancamentosCaixa).values({
      id,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      valor: lancamento.valor,
      data: lancamento.data || new Date().toISOString(),
      pedidoId: lancamento.pedidoId,
    }).run();

    const result = this.drizzle.select().from(lancamentosCaixa).where(eq(lancamentosCaixa.id, id)).get();
    return result!;
  }

  async getResumoCaixa(start?: string, end?: string): Promise<ResumoCaixa> {
    const conditions = [];
    if (start) conditions.push(gte(lancamentosCaixa.data, start));
    if (end) conditions.push(lte(lancamentosCaixa.data, end));

    let query = this.drizzle.select().from(lancamentosCaixa);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const lancamentos = query.all();

    const entradas = lancamentos
      .filter(l => l.tipo === TipoLancamento.Entrada)
      .reduce((sum, l) => sum + l.valor, 0);

    const saidas = lancamentos
      .filter(l => l.tipo === TipoLancamento.Saida)
      .reduce((sum, l) => sum + l.valor, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }
}

export const storage = new SQLiteStorage();
