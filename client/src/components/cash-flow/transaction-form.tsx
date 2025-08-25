import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertLancamentoCaixaSchema, TipoLancamento, type InsertLancamentoCaixa } from "../../../../shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TransactionForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertLancamentoCaixa>({
    resolver: zodResolver(insertLancamentoCaixaSchema),
    defaultValues: {
      tipo: TipoLancamento.Entrada,
      categoria: "",
      valor: 0,
      data: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: api.caixa.createLancamento,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Lançamento criado com sucesso!",
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/caixa"),
      });
      form.reset({
        tipo: TipoLancamento.Entrada,
        categoria: "",
        valor: 0,
        data: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lançamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLancamentoCaixa) => {
    const { valor } = data;
    if (valor === 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser diferente de ZERO",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Novo Lançamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </Label>
            <Select
              value={form.watch("tipo")?.toString()}
              onValueChange={(value) => form.setValue("tipo", parseInt(value))}
            >
              <SelectTrigger data-testid="select-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TipoLancamento.Entrada.toString()}>Entrada</SelectItem>
                <SelectItem value={TipoLancamento.Saida.toString()}>Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </Label>
            <Input
              id="categoria"
              {...form.register("categoria")}
              placeholder="Ex: Frete, Insumos, Energia"
              data-testid="input-categoria"
            />
            {form.formState.errors.categoria && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.categoria.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              {...form.register("valor", { valueAsNumber: true })}
              placeholder="0,00"
              data-testid="input-valor"
            />
            {form.formState.errors.valor && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.valor.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </Label>
            <Input
              id="data"
              type="date"
              {...form.register("data")}
              data-testid="input-data"
            />
            {form.formState.errors.data && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.data.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full"
            data-testid="button-criar-lancamento"
          >
            {createMutation.isPending ? "Criando..." : "Criar Lançamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
