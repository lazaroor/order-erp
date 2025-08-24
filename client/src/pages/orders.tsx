import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusPedido } from "@shared/schema";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { OrderForm } from "@/components/orders/order-form";
import { OrderTable } from "@/components/orders/order-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const statusFilters = [
  { label: "Todos", value: undefined, variant: "default" as const },
  { label: "Em Produção", value: StatusPedido.EmProducao, variant: "secondary" as const },
  { label: "Enviado", value: StatusPedido.Enviado, variant: "default" as const },
  { label: "Aguardando Pagamento", value: StatusPedido.AguardandoPagamento, variant: "secondary" as const },
  { label: "Concluído", value: StatusPedido.Concluido, variant: "default" as const },
  { label: "Cancelado", value: StatusPedido.Cancelado, variant: "destructive" as const },
];

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["/api/pedidos", selectedStatus, startDate, endDate],
    queryFn: () => api.pedidos.list(selectedStatus, startDate, endDate),
  });

  const handleFilter = () => {
    // Query will automatically refetch when dependencies change
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Pedidos" 
        subtitle="Gerencie seus pedidos e controle o status" 
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
              {statusFilters.map((filter) => (
                <Badge
                  key={filter.label}
                  variant={selectedStatus === filter.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => setSelectedStatus(filter.value)}
                  data-testid={`filter-${filter.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
                data-testid="input-data-inicio"
              />
              <span className="text-gray-500">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
                data-testid="input-data-fim"
              />
              <Button onClick={handleFilter} data-testid="button-filtrar">
                Filtrar
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Pedidos</h3>
            <Badge variant="outline" data-testid="badge-pedidos-count">
              {pedidos.length} pedidos
            </Badge>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
            data-testid="button-novo-pedido"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center" data-testid="loading-orders">
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : (
          <OrderTable pedidos={pedidos || []} />
        )}

        {/* Modal */}
        <OrderForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
