import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusPedido, type PedidoComItens } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ShippingModal } from "./shipping-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface OrderTableProps {
  pedidos: PedidoComItens[];
}

const statusLabels: Record<number, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  [StatusPedido.AguardandoPagamento]: { label: "Aguardando Pagamento", variant: "secondary" },
  [StatusPedido.EmProducao]: { label: "Em Produção", variant: "secondary" },
  [StatusPedido.Enviado]: { label: "Enviado", variant: "default" },
  [StatusPedido.Concluido]: { label: "Concluído", variant: "default" },
  [StatusPedido.Cancelado]: { label: "Cancelado", variant: "destructive" },
};

export function OrderTable({ pedidos }: OrderTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shippingModal, setShippingModal] = useState<{ isOpen: boolean; pedidoId: string; pedidoNumero: string }>({
    isOpen: false,
    pedidoId: "",
    pedidoNumero: "",
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.pedidos.updateStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixa"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const handleShip = (pedido: PedidoComItens) => {
    setShippingModal({
      isOpen: true,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero,
    });
  };

  const closeShippingModal = () => {
    setShippingModal({
      isOpen: false,
      pedidoId: "",
      pedidoNumero: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = (pedido: PedidoComItens) => {
    return pedido.itens.reduce((sum, item) => sum + (item.quantidade * item.precoUnitario), 0);
  };

  const canTransition = (currentStatus: number, newStatus: string) => {
    switch (newStatus) {
      case 'Enviado':
        return currentStatus === StatusPedido.EmProducao;
      case 'AguardandoPagamento':
        return currentStatus === StatusPedido.Enviado;
      case 'Concluido':
        return currentStatus === StatusPedido.AguardandoPagamento;
      case 'Cancelado':
        return currentStatus !== StatusPedido.Concluido;
      default:
        return false;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rastreio
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => {
              const statusInfo = statusLabels[pedido.status];
              const total = calculateTotal(pedido);

              return (
                <TableRow key={pedido.id} className="hover:bg-gray-50" data-testid={`row-pedido-${pedido.id}`}>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900" data-testid={`text-numero-${pedido.id}`}>
                      {pedido.numero}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900" data-testid={`text-cliente-${pedido.id}`}>
                      {pedido.clienteNome || "Sem nome"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant} data-testid={`badge-status-${pedido.id}`}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900" data-testid={`text-total-${pedido.id}`}>
                      R$ {total.toFixed(2).replace('.', ',')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pedido.codigoRastreio ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-900 font-mono" data-testid={`text-rastreio-${pedido.id}`}>
                          {pedido.codigoRastreio}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400" data-testid={`text-sem-rastreio-${pedido.id}`}>
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500" data-testid={`text-data-${pedido.id}`}>
                      {formatDate(pedido.criadoEm)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {canTransition(pedido.status, 'Enviado') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShip(pedido)}
                          disabled={updateStatusMutation.isPending}
                          className="text-blue-600 hover:text-blue-900"
                          data-testid={`button-enviar-${pedido.id}`}
                        >
                          Enviar
                        </Button>
                      )}
                      {canTransition(pedido.status, 'AguardandoPagamento') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: pedido.id, status: 'AguardandoPagamento' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-blue-600 hover:text-blue-900"
                          data-testid={`button-instalar-${pedido.id}`}
                        >
                          Instalar
                        </Button>
                      )}
                      {canTransition(pedido.status, 'Concluido') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: pedido.id, status: 'Concluido' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-green-600 hover:text-green-900"
                          data-testid={`button-confirmar-${pedido.id}`}
                        >
                          Confirmar Pgto
                        </Button>
                      )}
                      {canTransition(pedido.status, 'Cancelado') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: pedido.id, status: 'Cancelado' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`button-cancelar-${pedido.id}`}
                        >
                          Cancelar
                        </Button>
                      )}
                      {pedido.status === StatusPedido.Concluido && (
                        <span className="text-gray-400 text-sm">Finalizado</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {pedidos.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="text-no-orders">
          Nenhum pedido encontrado
        </div>
      )}

      {/* Modal de Envio */}
      <ShippingModal
        isOpen={shippingModal.isOpen}
        onClose={closeShippingModal}
        pedidoId={shippingModal.pedidoId}
        pedidoNumero={shippingModal.pedidoNumero}
      />
    </div>
  );
}
