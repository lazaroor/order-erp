import { apiRequest } from "./queryClient";
import type { 
  Produto, 
  PedidoComItens, 
  LancamentoCaixa, 
  ResumoCaixa, 
  InsertPedido, 
  InsertLancamentoCaixa,
  InsertProduto
} from "@shared/schema";

export const api = {
  // Produtos
  produtos: {
    list: (): Promise<Produto[]> =>
      fetch("/api/produtos").then(res => res.json()),

    create: async (produto: InsertProduto): Promise<Produto> => {
      const response = await apiRequest("POST", "/api/produtos", produto);
      return response.json();
    },

    update: async (id: number, produto: InsertProduto): Promise<Produto> => {
      const response = await apiRequest("PUT", `/api/produtos/${id}`, produto);
      return response.json();
    },
  },

  // Pedidos
  pedidos: {
    list: (status?: number, start?: string, end?: string): Promise<PedidoComItens[]> => {
      const params = new URLSearchParams();
      if (status) params.append('status', status.toString());
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      
      const url = `/api/pedidos${params.toString() ? `?${params}` : ''}`;
      return fetch(url).then(res => res.json());
    },

    get: (id: string): Promise<PedidoComItens> =>
      fetch(`/api/pedidos/${id}`).then(res => res.json()),

    create: async (pedido: InsertPedido): Promise<PedidoComItens> => {
      const response = await apiRequest("POST", "/api/pedidos", pedido);
      return response.json();
    },

    updateStatus: async (id: string, status: string): Promise<PedidoComItens> => {
      const response = await apiRequest("POST", `/api/pedidos/${id}/status?novo=${status}`);
      return response.json();
    },
  },

  // Caixa
  caixa: {
    lancamentos: (start?: string, end?: string): Promise<LancamentoCaixa[]> => {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      
      const url = `/api/caixa/lancamentos${params.toString() ? `?${params}` : ''}`;
      return fetch(url).then(res => res.json());
    },

    createLancamento: async (lancamento: InsertLancamentoCaixa): Promise<LancamentoCaixa> => {
      const response = await apiRequest("POST", "/api/caixa/lancamentos", lancamento);
      return response.json();
    },

    resumo: (start?: string, end?: string): Promise<ResumoCaixa> => {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      
      const url = `/api/caixa/resumo${params.toString() ? `?${params}` : ''}`;
      return fetch(url).then(res => res.json());
    },
  },
};
