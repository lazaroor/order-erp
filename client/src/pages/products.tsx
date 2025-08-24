import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import type { Produto } from "@shared/schema";

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | undefined>(undefined);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["/api/produtos"],
    queryFn: () => api.produtos.list(),
  });

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Produtos" 
        subtitle="Gerencie produtos e preços" 
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Produtos Cadastrados</h3>
            <p className="text-sm text-gray-500">Gerencie os produtos e seus preços</p>
          </div>
          <Button 
            onClick={handleNew}
            className="flex items-center"
            data-testid="button-novo-produto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Lista de Produtos</CardTitle>
                <Badge variant="outline" data-testid="badge-produtos-count">
                  {produtos.length} produtos
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8" data-testid="loading-products">
                <p className="text-gray-500">Carregando produtos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {produtos.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg" data-testid={`product-${produto.id}`}>
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-gray-900" data-testid={`text-nome-${produto.id}`}>
                        {produto.nome}
                      </h4>
                      <p className="text-sm text-gray-500" data-testid={`text-id-${produto.id}`}>
                        ID: {produto.id}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Preço de Venda</p>
                        <p className="font-medium text-gray-900" data-testid={`text-preco-${produto.id}`}>
                          R$ {produto.precoVenda.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Custo Unitário</p>
                        <p className="font-medium text-gray-900" data-testid={`text-custo-${produto.id}`}>
                          R$ {produto.custoUnitario.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-6">
                      <Badge 
                        variant={produto.ativo ? "default" : "secondary"}
                        data-testid={`badge-status-${produto.id}`}
                      >
                        {produto.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(produto)}
                        data-testid={`button-editar-${produto.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <ProductForm 
          isOpen={isModalOpen} 
          onClose={handleClose}
          produto={editingProduct}
        />
      </div>
    </div>
  );
}
