import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProdutoSchema, type InsertProduto, type Produto } from "../../../../shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: Produto;
}

export function ProductForm({ isOpen, onClose, produto }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!produto;

  const form = useForm<InsertProduto>({
    resolver: zodResolver(insertProdutoSchema),
    defaultValues: {
      nome: produto?.nome || "",
      precoVenda: produto?.precoVenda || 0,
      custoUnitario: produto?.custoUnitario || 0,
      ativo: produto?.ativo ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: api.produtos.create,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar produto",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertProduto) => api.produtos.update(produto!.id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar produto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
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
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isEdit ? "Editar Produto" : "Novo Produto"}
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
            <Label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto
            </Label>
            <Input
              id="nome"
              {...form.register("nome")}
              placeholder="Ex: SUPORTE_PEQUENO"
              data-testid="input-nome"
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.nome.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="precoVenda" className="block text-sm font-medium text-gray-700 mb-1">
              Preço de Venda (R$)
            </Label>
            <Input
              id="precoVenda"
              type="number"
              step="0.01"
              min="0"
              {...form.register("precoVenda", { valueAsNumber: true })}
              placeholder="0,00"
              data-testid="input-preco-venda"
            />
            {form.formState.errors.precoVenda && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.precoVenda.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="custoUnitario" className="block text-sm font-medium text-gray-700 mb-1">
              Custo Unitário (R$)
            </Label>
            <Input
              id="custoUnitario"
              type="number"
              step="0.01"
              min="0"
              {...form.register("custoUnitario", { valueAsNumber: true })}
              placeholder="0,00"
              data-testid="input-custo-unitario"
            />
            {form.formState.errors.custoUnitario && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.custoUnitario.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={form.watch("ativo")}
              onCheckedChange={(checked) => form.setValue("ativo", checked)}
              data-testid="switch-ativo"
            />
            <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Produto Ativo
            </Label>
          </div>

          {/* Margem Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Margem Estimada</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Margem:</span>
              <span className={`font-medium ${
                (form.watch("precoVenda") - form.watch("custoUnitario")) >= 0 ? 'text-green-600' : 'text-red-600'
              }`} data-testid="text-margem">
                R$ {(form.watch("precoVenda") - form.watch("custoUnitario")).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Margem %:</span>
              <span className={`font-medium ${
                form.watch("precoVenda") > 0 && (((form.watch("precoVenda") - form.watch("custoUnitario")) / form.watch("precoVenda")) * 100) >= 0 
                  ? 'text-green-600' : 'text-red-600'
              }`} data-testid="text-margem-percent">
                {form.watch("precoVenda") > 0 
                  ? (((form.watch("precoVenda") - form.watch("custoUnitario")) / form.watch("precoVenda")) * 100).toFixed(1)
                  : '0,0'}%
              </span>
            </div>
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
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-salvar"
            >
              {createMutation.isPending || updateMutation.isPending 
                ? "Salvando..." 
                : isEdit ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}