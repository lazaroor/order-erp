import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPedidoSchema, type InsertPedido, type Produto } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderForm({ isOpen, onClose }: OrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: produtos = [] } = useQuery({
    queryKey: ["/api/produtos"],
    queryFn: () => api.produtos.list(),
  });

  const form = useForm<InsertPedido>({
    resolver: zodResolver(insertPedidoSchema),
    defaultValues: {
      clienteNome: "",
      itens: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: api.pedidos.create,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos"] });
      onClose();
      form.reset();
      setQuantities({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (produtoId: number, quantidade: number) => {
    setQuantities(prev => ({
      ...prev,
      [produtoId]: Math.max(0, quantidade)
    }));
  };

  const calculateSummary = () => {
    const receita = produtos.reduce((sum, produto) => {
      const qty = quantities[produto.id] || 0;
      return sum + (qty * produto.precoVenda);
    }, 0);

    const cogs = produtos.reduce((sum, produto) => {
      const qty = quantities[produto.id] || 0;
      return sum + (qty * produto.custoUnitario);
    }, 0);

    return {
      receita,
      cogs,
      margem: receita - cogs
    };
  };

  const onSubmit = (data: InsertPedido) => {
    const itens = produtos
      .filter(produto => quantities[produto.id] > 0)
      .map(produto => ({
        produtoId: produto.id,
        quantidade: quantities[produto.id],
        precoUnitario: 0 // API will use current product price
      }));

    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...data,
      itens
    });
  };

  const summary = calculateSummary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">Novo Pedido</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-modal"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cliente */}
          <div>
            <Label htmlFor="clienteNome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cliente (Opcional)
            </Label>
            <Input
              id="clienteNome"
              {...form.register("clienteNome")}
              placeholder="Digite o nome do cliente"
              data-testid="input-cliente-nome"
            />
          </div>

          {/* Produtos */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Itens do Pedido</h4>
            <div className="space-y-4">
              {produtos.map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{produto.nome}</h5>
                    <p className="text-sm text-gray-500">
                      Preço: R$ {produto.precoVenda.toFixed(2).replace('.', ',')} | 
                      Custo: R$ {produto.custoUnitario.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Label htmlFor={`qtd-${produto.id}`} className="text-sm text-gray-600">
                      Quantidade:
                    </Label>
                    <Input
                      type="number"
                      id={`qtd-${produto.id}`}
                      min="0"
                      value={quantities[produto.id] || 0}
                      onChange={(e) => handleQuantityChange(produto.id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      data-testid={`input-quantidade-${produto.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resumo do Pedido</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Receita Estimada:</span>
                <span className="font-medium text-gray-900" data-testid="text-receita-estimada">
                  R$ {summary.receita.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">COGS Estimado:</span>
                <span className="font-medium text-gray-900" data-testid="text-cogs-estimado">
                  R$ {summary.cogs.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Margem Estimada:</span>
                  <span className="text-green-600" data-testid="text-margem-estimada">
                    R$ {summary.margem.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-criar-pedido"
            >
              {createMutation.isPending ? "Criando..." : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
