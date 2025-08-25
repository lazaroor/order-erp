import { useState, Fragment } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { StatusPedido, type PedidoComItens, UserRole, TipoLancamento, type LancamentoCaixa } from "../../../../shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ShippingModal } from "./shipping-modal";
import { PaymentModal } from "./payment-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderTableProps {
  pedidos: PedidoComItens[];
}

const statusLabels: Record<number, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  [StatusPedido.EmProducao]: { label: "Em Produção", variant: "secondary" },
  [StatusPedido.Enviado]: { label: "Enviado", variant: "default" },
  [StatusPedido.Concluido]: { label: "Concluído", variant: "default" },
  [StatusPedido.Cancelado]: { label: "Cancelado", variant: "destructive" },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function OrderTable({ pedidos }: OrderTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [shippingModal, setShippingModal] = useState<{ isOpen: boolean; pedidoId: string; pedidoNumero: string }>({
    isOpen: false,
    pedidoId: "",
    pedidoNumero: "",
  });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; pedido: PedidoComItens | null }>({
    isOpen: false,
    pedido: null,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handlePayment = (pedido: PedidoComItens) => {
    setPaymentModal({
      isOpen: true,
      pedido,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const closeShippingModal = () => {
    setShippingModal({
      isOpen: false,
      pedidoId: "",
      pedidoNumero: "",
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      pedido: null,
    });
  };

  const calculateTotal = (pedido: PedidoComItens) => {
    return pedido.itens.reduce((sum, item) => sum + (item.quantidade * item.precoUnitario), 0);
  };

  const canTransition = (currentStatus: number, newStatus: string) => {
    switch (newStatus) {
      case 'Enviado':
        return currentStatus === StatusPedido.EmProducao;
      case 'Concluido':
        return currentStatus === StatusPedido.Enviado;
      case 'Cancelado':
        return (
          currentStatus !== StatusPedido.Concluido &&
          currentStatus !== StatusPedido.Cancelado
        );
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
                <Fragment key={pedido.id}>
                <TableRow
                  onClick={() => toggleExpand(pedido.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                  data-testid={`row-pedido-${pedido.id}`}
                >
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
                        <a href={`https://websro.app/?codigo=${pedido.codigoRastreio}&Z_ACTION=Pesquisar`} target="_blank" rel="noopener noreferrer">
                          <span className="text-sm text-gray-900 font-mono" data-testid={`text-rastreio-${pedido.id}`}>
                            {pedido.codigoRastreio}
                          </span>
                        </a>
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
                      {canTransition(pedido.status, 'Enviado') && user?.role === UserRole.Admin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleShip(pedido); }}
                          disabled={updateStatusMutation.isPending}
                          className="text-blue-600 hover:text-blue-900"
                          data-testid={`button-enviar-${pedido.id}`}
                        >
                          Enviar
                        </Button>
                      )}
                      {canTransition(pedido.status, 'Concluido') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handlePayment(pedido); }}
                          disabled={updateStatusMutation.isPending}
                          className="text-green-600 hover:text-green-900"
                          data-testid={`button-concluir-${pedido.id}`}
                        >
                          Concluir
                        </Button>
                      )}
                      {canTransition(pedido.status, 'Cancelado') && user?.role === UserRole.Admin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: pedido.id, status: 'Cancelado' }); }}
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
                      {pedido.status === StatusPedido.Cancelado && (
                        <span className="text-gray-400 text-sm">Finalizado</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {expandedId === pedido.id && (
                  <TableRow className="bg-gray-50" data-testid={`row-itens-${pedido.id}`}>
                    <TableCell colSpan={7}>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Itens</h4>
                          <ul className="space-y-1">
                            {pedido.itens.map((item) => (
                              <li key={item.id} className="flex justify-center gap-2 text-sm">
                                <span>{item.produto.nome}</span>
                                <span className="text-gray-600">Qtd: {item.quantidade}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <PaymentHistory pedidoId={pedido.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
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
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        pedido={paymentModal.pedido}
      />
    </div>
  );
}

function PaymentHistory({ pedidoId }: { pedidoId: string }) {
  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["/api/caixa/lancamentos", pedidoId],
    queryFn: () => api.caixa.lancamentos(undefined, undefined, pedidoId),
    enabled: !!pedidoId,
  });

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const pagamentos = (lancamentos as LancamentoCaixa[]).filter(
    (l) => l.tipo === TipoLancamento.Entrada
  );

  if (isLoading) {
    return <p className="text-sm text-gray-500">Carregando pagamentos...</p>;
  }

  if (pagamentos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum pagamento registrado</p>;
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Pagamentos</h4>
      <ul className="space-y-4">
        {pagamentos.map((pagamento) => (
          <li key={pagamento.id} className="text-sm text-gray-700">
            <p>
              Pago em {formatDate(pagamento.data)} - R$ {pagamento.valor
                .toFixed(2)
                .replace('.', ',')}
            </p>
            {pagamento.comprovante && (
              <img
                src={pagamento.comprovante}
                alt="Comprovante"
                className="mt-2 w-32 h-auto cursor-pointer border rounded"
                onClick={() => setSelectedReceipt(pagamento.comprovante!)}
              />
            )}
          </li>
        ))}
      </ul>
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <img src={selectedReceipt} alt="Comprovante" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
