import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Truck } from "lucide-react";

const shippingSchema = z.object({
  codigoRastreio: z.string().min(1, "Código de rastreio é obrigatório"),
  custoFrete: z.number().min(0, "Custo do frete deve ser maior ou igual a zero"),
});

type ShippingData = z.infer<typeof shippingSchema>;

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
  pedidoNumero: string;
}

export function ShippingModal({ isOpen, onClose, pedidoId, pedidoNumero }: ShippingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      codigoRastreio: "",
      custoFrete: 0,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: ShippingData) => {
      const response = await fetch(`/api/pedidos/${pedidoId}/status?novo=Enviado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar pedido');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pedido enviado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixa"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar pedido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShippingData) => {
    updateStatusMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Enviar Pedido {pedidoNumero}
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="codigoRastreio" className="block text-sm font-medium text-gray-700 mb-1">
              Código de Rastreio
            </Label>
            <Input
              id="codigoRastreio"
              {...form.register("codigoRastreio")}
              placeholder="Ex: BR123456789BR"
              data-testid="input-codigo-rastreio"
            />
            {form.formState.errors.codigoRastreio && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.codigoRastreio.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="custoFrete" className="block text-sm font-medium text-gray-700 mb-1">
              Custo do Frete (R$)
            </Label>
            <Input
              id="custoFrete"
              type="number"
              step="0.01"
              min="0"
              {...form.register("custoFrete", { valueAsNumber: true })}
              placeholder="0,00"
              data-testid="input-custo-frete"
            />
            {form.formState.errors.custoFrete && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.custoFrete.message}</p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> O custo do frete será automaticamente registrado como saída no fluxo de caixa.
            </p>
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
              disabled={updateStatusMutation.isPending}
              data-testid="button-enviar-pedido"
            >
              {updateStatusMutation.isPending ? "Enviando..." : "Enviar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}