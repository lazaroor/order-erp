import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TipoLancamento, type LancamentoCaixa } from "../../../shared/schema";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { CashDashboard } from "@/components/cash-flow/cash-dashboard";
import { TransactionForm } from "@/components/cash-flow/transaction-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CashFlow() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["/api/caixa/lancamentos", startDate, endDate],
    queryFn: () => api.caixa.lancamentos(startDate, endDate),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number, tipo: number) => {
    const symbol = tipo === TipoLancamento.Entrada ? '+' : '-';
    const colorClass = tipo === TipoLancamento.Entrada ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-sm font-medium ${colorClass}`}>
        {symbol}R$ {value.toFixed(2).replace('.', ',')}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Fluxo de Caixa" 
        subtitle="Controle entradas e saídas financeiras" 
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Dashboard Cards */}
        <div className="mb-6">
          <CashDashboard startDate={startDate} endDate={endDate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Form */}
          <TransactionForm />

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Últimos Lançamentos</CardTitle>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                    data-testid="input-historico-inicio"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs"
                    data-testid="input-historico-fim"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4" data-testid="loading-transactions">
                    <p className="text-gray-500">Carregando lançamentos...</p>
                  </div>
                ) : lancamentos.length === 0 ? (
                  <div className="text-center py-4" data-testid="text-no-transactions">
                    <p className="text-gray-500">Nenhum lançamento encontrado</p>
                  </div>
                ) : (
                  lancamentos.map((lancamento: LancamentoCaixa) => (
                    <div key={lancamento.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`transaction-${lancamento.id}`}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            lancamento.tipo === TipoLancamento.Entrada ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900" data-testid={`text-categoria-${lancamento.id}`}>
                            {lancamento.categoria}
                          </p>
                          <p className="text-xs text-gray-500" data-testid={`text-data-${lancamento.id}`}>
                            {formatDate(lancamento.data)}
                          </p>
                        </div>
                      </div>
                      <div data-testid={`text-valor-${lancamento.id}`}>
                        {formatCurrency(lancamento.valor, lancamento.tipo)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
