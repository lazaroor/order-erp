import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPedidoSchema, insertLancamentoCaixaSchema, insertProdutoSchema, StatusPedido } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Produtos endpoints
  app.get("/api/produtos", async (req, res) => {
    try {
      const produtos = await storage.getProdutos();
      res.json(produtos);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/produtos", async (req, res) => {
    try {
      const validatedData = insertProdutoSchema.parse(req.body);
      const produto = await storage.createProduto(validatedData);
      res.status(201).json(produto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/produtos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProdutoSchema.parse(req.body);
      const produto = await storage.updateProduto(id, validatedData);
      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(produto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Pedidos endpoints
  app.get("/api/pedidos", async (req, res) => {
    try {
      const { status, start, end } = req.query;
      const statusNum = status ? parseInt(status as string) : undefined;
      const pedidos = await storage.getPedidos(statusNum, start as string, end as string);
      res.json(pedidos);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/pedidos/:id", async (req, res) => {
    try {
      const pedido = await storage.getPedido(req.params.id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      res.json(pedido);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/pedidos", async (req, res) => {
    try {
      const validatedData = insertPedidoSchema.parse(req.body);
      
      // Validate that at least one item has quantity > 0
      if (!validatedData.itens.some(item => item.quantidade > 0)) {
        return res.status(400).json({ message: "Pedido deve ter pelo menos um item com quantidade maior que zero" });
      }

      const pedido = await storage.createPedido(validatedData);
      res.status(201).json(pedido);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/pedidos/:id/status", async (req, res) => {
    try {
      const { novo } = req.query;
      const { codigoRastreio, custoFrete } = req.body;
      
      if (!novo) {
        return res.status(400).json({ message: "Parâmetro 'novo' é obrigatório" });
      }

      let novoStatus: number;
      switch (novo) {
        case 'EmProducao':
          novoStatus = StatusPedido.EmProducao;
          break;
        case 'Enviado':
          novoStatus = StatusPedido.Enviado;
          break;
        case 'Concluido':
          novoStatus = StatusPedido.Concluido;
          break;
        case 'Cancelado':
          novoStatus = StatusPedido.Cancelado;
          break;
        default:
          return res.status(400).json({ message: "Status inválido" });
      }

      const pedido = await storage.updatePedidoStatus(req.params.id, novoStatus, codigoRastreio, custoFrete);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      res.json(pedido);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Caixa endpoints
  app.get("/api/caixa/lancamentos", async (req, res) => {
    try {
      const { start, end, pedidoId } = req.query;
      const lancamentos = await storage.getLancamentosCaixa(start as string, end as string, pedidoId as string);
      res.json(lancamentos);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/caixa/lancamentos", async (req, res) => {
    try {
      const validatedData = insertLancamentoCaixaSchema.parse(req.body);
      const lancamento = await storage.createLancamentoCaixa(validatedData);
      res.status(201).json(lancamento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/caixa/resumo", async (req, res) => {
    try {
      const { start, end } = req.query;
      const resumo = await storage.getResumoCaixa(start as string, end as string);
      res.json(resumo);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
