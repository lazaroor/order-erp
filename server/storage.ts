import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  StatusPedido,
  TipoLancamento,
  type Produto,
  type ItemPedido,
  type LancamentoCaixa,
  type PedidoComItens,
  type ResumoCaixa,
  type InsertProduto,
  type InsertPedido,
  type InsertLancamentoCaixa,
  type InsertUsuario,
  type Usuario,
} from "../shared/schema";

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
  getLancamentosCaixa(start?: string, end?: string, pedidoId?: string): Promise<LancamentoCaixa[]>;
  createLancamentoCaixa(lancamento: InsertLancamentoCaixa): Promise<LancamentoCaixa>;
  getResumoCaixa(start?: string, end?: string): Promise<ResumoCaixa>;

  // Usuários
  createUsuario(usuario: InsertUsuario): Promise<Usuario>;
  getUsuarios(): Promise<Usuario[]>;
  getUsuarioByNome(nome: string): Promise<Usuario | undefined>;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or key missing in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function mapProduto(row: any): Produto {
  return {
    id: row.id,
    nome: row.nome,
    precoVenda: row.preco_venda,
    custoUnitario: row.custo_unitario,
    ativo: row.ativo,
  };
}

function mapItemPedido(row: any): ItemPedido {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    produtoId: row.produto_id,
    quantidade: row.quantidade,
    precoUnitario: row.preco_unitario,
  };
}

function mapLancamento(row: any): LancamentoCaixa {
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    valor: row.valor,
    data: row.data,
    pedidoId: row.pedido_id,
    comprovante: row.comprovante ?? undefined,
  };
}

function mapUsuario(row: any): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    role: row.role,
  };
}

class SupabaseStorage implements IStorage {
  constructor(private db: SupabaseClient) {}

  async getProdutos(): Promise<Produto[]> {
    const { data, error } = await this.db
      .from('produtos')
      .select('*')
      .eq('ativo', true);
    if (error) throw error;
    return (data ?? []).map(mapProduto);
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    const { data, error } = await this.db
      .from('produtos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProduto(data) : undefined;
  }

  async createProduto(insert: InsertProduto): Promise<Produto> {
    const { data, error } = await this.db
      .from('produtos')
      .insert({
        nome: insert.nome,
        preco_venda: insert.precoVenda,
        custo_unitario: insert.custoUnitario,
        ativo: insert.ativo ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProduto(data);
  }

  async updateProduto(id: number, insert: InsertProduto): Promise<Produto | undefined> {
    const { data, error } = await this.db
      .from('produtos')
      .update({
        nome: insert.nome,
        preco_venda: insert.precoVenda,
        custo_unitario: insert.custoUnitario,
        ativo: insert.ativo ?? true,
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapProduto(data) : undefined;
  }

  async getPedidos(status?: number, start?: string, end?: string): Promise<PedidoComItens[]> {
    let query = this.db
      .from('pedidos')
      .select('*, itens_pedido(*, produto:produtos(*))')
      .order('criado_em', { ascending: false });

    if (status) query = query.eq('status', status);
    if (start) query = query.gte('criado_em', start);
    if (end) query = query.lte('criado_em', end);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      numero: row.numero,
      clienteNome: row.cliente_nome,
      status: row.status,
      codigoRastreio: row.codigo_rastreio ?? undefined,
      custoFrete: row.custo_frete ?? 0,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      itens: (row.itens_pedido ?? []).map((i: any) => ({
        ...mapItemPedido(i),
        produto: mapProduto(i.produto)
      })),
    }));
  }

  async getPedido(id: string): Promise<PedidoComItens | undefined> {
    const { data, error } = await this.db
      .from('pedidos')
      .select('*, itens_pedido(*, produto:produtos(*))')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      numero: data.numero,
      clienteNome: data.cliente_nome,
      status: data.status,
      codigoRastreio: data.codigo_rastreio ?? undefined,
      custoFrete: data.custo_frete ?? 0,
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
      itens: (data.itens_pedido ?? []).map((i: any) => ({
        ...mapItemPedido(i),
        produto: mapProduto(i.produto)
      })),
    };
  }

  async createPedido(insertPedido: InsertPedido): Promise<PedidoComItens> {
    const { generateOrderNumber } = await import('./services/numberService');
    const numero = await generateOrderNumber();

    const { data: pedido, error: pedidoError } = await this.db
      .from('pedidos')
      .insert({
        numero,
        cliente_nome: insertPedido.clienteNome,
        status: StatusPedido.EmProducao,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single();
    if (pedidoError) throw pedidoError;

    let custoTotalProducao = 0;
    for (const item of insertPedido.itens) {
      const { data: prod } = await this.db
        .from('produtos')
        .select('*')
        .eq('id', item.produtoId)
        .maybeSingle();
      if (!prod) throw new Error(`Produto ${item.produtoId} não encontrado`);

      const precoUnitario = item.precoUnitario && item.precoUnitario > 0 ? item.precoUnitario : prod.preco_venda;
      custoTotalProducao += item.quantidade * prod.custo_unitario;

      await this.db.from('itens_pedido').insert({
        pedido_id: pedido.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: precoUnitario,
      });
    }

    if (custoTotalProducao > 0) {
      await this.db.from('lancamentos_caixa').insert({
        tipo: TipoLancamento.Saida,
        categoria: 'Custo de Produção',
        valor: custoTotalProducao,
        data: new Date().toISOString(),
        pedido_id: pedido.id,
      });
    }

    const result = await this.getPedido(pedido.id);
    if (!result) throw new Error('Erro ao criar pedido');
    return result;
  }

  async updatePedidoStatus(id: string, novoStatus: number, codigoRastreio?: string, custoFrete?: number): Promise<PedidoComItens | undefined> {
    const pedidoAtual = await this.getPedido(id);
    if (!pedidoAtual) return undefined;

    if (pedidoAtual.status === StatusPedido.Concluido && novoStatus !== StatusPedido.Concluido) {
      throw new Error('Não é possível alterar status de pedido concluído');
    }

    const updateData: any = {
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    };
    if (codigoRastreio !== undefined) updateData.codigo_rastreio = codigoRastreio;
    if (custoFrete !== undefined) updateData.custo_frete = custoFrete;

    const { error } = await this.db
      .from('pedidos')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;

    if (novoStatus === StatusPedido.Enviado && custoFrete && custoFrete > 0) {
      await this.db.from('lancamentos_caixa').insert({
        tipo: TipoLancamento.Saida,
        categoria: 'Frete',
        valor: custoFrete,
        data: new Date().toISOString(),
        pedido_id: id,
      });
    }

    if (novoStatus === StatusPedido.Cancelado) {
      await this.db.from('lancamentos_caixa').delete().eq('pedido_id', id);
    }

    return await this.getPedido(id);
  }

  async getLancamentosCaixa(start?: string, end?: string, pedidoId?: string): Promise<LancamentoCaixa[]> {
    let query = this.db.from('lancamentos_caixa').select('*').order('data', { ascending: false });
    if (start) query = query.gte('data', start);
    if (end) query = query.lte('data', end);
    if (pedidoId) query = query.eq('pedido_id', pedidoId);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapLancamento);
  }

  async createLancamentoCaixa(lancamento: InsertLancamentoCaixa): Promise<LancamentoCaixa> {
    const { data, error } = await this.db
      .from('lancamentos_caixa')
      .insert({
        tipo: lancamento.tipo,
        categoria: lancamento.categoria,
        valor: lancamento.valor,
        data: lancamento.data || new Date().toISOString(),
        pedido_id: lancamento.pedidoId,
        comprovante: lancamento.comprovante,
      })
      .select()
      .single();
    if (error) throw error;
    return mapLancamento(data);
  }

  async getResumoCaixa(start?: string, end?: string): Promise<ResumoCaixa> {
    let query = this.db.from('lancamentos_caixa').select('*');
    if (start) query = query.gte('data', start);
    if (end) query = query.lte('data', end);

    const { data, error } = await query;
    if (error) throw error;
    const lancamentos = data ?? [];

    const entradas = lancamentos.filter(l => l.tipo === TipoLancamento.Entrada).reduce((sum, l) => sum + l.valor, 0);
    const saidas = lancamentos.filter(l => l.tipo === TipoLancamento.Saida).reduce((sum, l) => sum + l.valor, 0);

    return { entradas, saidas, saldo: entradas - saidas };
  }

  async createUsuario(usuario: InsertUsuario): Promise<Usuario> {
    const { data: existing } = await this.db
      .from('usuarios')
      .select('*')
      .eq('nome', usuario.nome)
      .maybeSingle();
    if (existing) {
      throw new Error('Usuário já existe');
    }

    const { data, error } = await this.db
      .from('usuarios')
      .insert({ nome: usuario.nome, role: usuario.role })
      .select()
      .single();
    if (error) throw error;
    return mapUsuario(data);
  }

  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await this.db.from('usuarios').select('*');
    if (error) throw error;
    return (data ?? []).map(mapUsuario);
  }

  async getUsuarioByNome(nome: string): Promise<Usuario | undefined> {
    const { data, error } = await this.db
      .from('usuarios')
      .select('*')
      .eq('nome', nome)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUsuario(data) : undefined;
  }
}

export const storage = new SupabaseStorage(supabase);
