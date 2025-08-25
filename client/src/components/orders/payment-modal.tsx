import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, DollarSign } from "lucide-react";
import { TipoLancamento, type PedidoComItens } from "../../../../shared/schema";

const paymentSchema = z.object({
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  comprovante: z.string().optional(),
});

type PaymentData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoComItens | null;
}

export function PaymentModal({ isOpen, onClose, pedido }: PaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { valor: 0, comprovante: undefined },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ["/api/caixa/lancamentos", pedido?.id],
    queryFn: () => api.caixa.lancamentos(undefined, undefined, pedido!.id),
    enabled: isOpen && !!pedido,
  });

  const totalPedido = pedido
    ? pedido.itens.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0)
    : 0;
  const totalPago = lancamentos
    .filter((l) => l.tipo === TipoLancamento.Entrada)
    .reduce((sum, l) => sum + l.valor, 0);
  const restante = totalPedido - totalPago;

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      return api.caixa.createLancamento({
        tipo: TipoLancamento.Entrada,
        categoria: "Receita de Venda",
        valor: data.valor,
        pedidoId: pedido!.id,
        comprovante: data.comprovante,
      });
    },
    onSuccess: async (_, variables) => {
      const novoTotalPago = totalPago + variables.valor;
      if (novoTotalPago >= totalPedido) {
        try {
          await api.pedidos.updateStatus(pedido!.id, "Concluido");
        } catch (error: any) {
          toast({
            title: "Erro",
            description: error.message || "Erro ao concluir pedido",
            variant: "destructive",
          });
        }
      }
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixa"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixa/lancamentos", pedido!.id] });
      form.reset({ valor: 0, comprovante: undefined });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentData) => {
    if (data.valor > restante) {
      toast({
        title: "Erro",
        description: "Valor excede o restante a pagar",
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset({ valor: 0, comprovante: undefined });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Registrar Pagamento {pedido?.numero}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-modal"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        {pedido && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-gray-700">
              <p>Total do Pedido: R$ {totalPedido.toFixed(2).replace('.', ',')}</p>
              <p>Pago: R$ {totalPago.toFixed(2).replace('.', ',')}</p>
              <p>Restante: R$ {restante.toFixed(2).replace('.', ',')}</p>
            </div>

            <div>
              <Label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor do Pagamento
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                {...form.register("valor", { valueAsNumber: true })}
                placeholder="0,00"
                data-testid="input-valor-pagamento"
              />
              {form.formState.errors.valor && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.valor.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="comprovante" className="block text-sm font-medium text-gray-700 mb-1">
                Comprovante (imagem)
              </Label>
              <Input
                id="comprovante"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      form.setValue("comprovante", reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                data-testid="input-comprovante"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={paymentMutation.isPending}
                data-testid="button-registrar-pagamento"
              >
                {paymentMutation.isPending ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
