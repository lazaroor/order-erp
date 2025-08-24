import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CashDashboardProps {
  startDate?: string;
  endDate?: string;
}

export function CashDashboard({ startDate, endDate }: CashDashboardProps) {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["/api/caixa/resumo", startDate, endDate],
    queryFn: () => api.caixa.resumo(startDate, endDate),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Entradas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Entradas</p>
              <p className="text-2xl font-semibold text-gray-900" data-testid="text-total-entradas">
                {formatCurrency(resumo?.entradas || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saídas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Saídas</p>
              <p className="text-2xl font-semibold text-gray-900" data-testid="text-total-saidas">
                {formatCurrency(resumo?.saidas || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Saldo</p>
              <p 
                className={`text-2xl font-semibold ${
                  (resumo?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
                data-testid="text-saldo"
              >
                {resumo?.saldo !== undefined && resumo.saldo < 0 ? '-' : ''}
                {formatCurrency(resumo?.saldo || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
