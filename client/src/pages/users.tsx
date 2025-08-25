import { useForm } from "react-hook-form";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUsuarioSchema, type InsertUsuario, UserRole } from "../../../shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserTable from "@/components/orders/user-table";

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertUsuario>({
    resolver: zodResolver(insertUsuarioSchema),
    defaultValues: {
      nome: "",
      role: UserRole.Usuario,
    },
  });

  const mutation = useMutation({
    mutationFn: api.usuarios.create,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
      form.reset({ nome: "", role: UserRole.Usuario });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const { data: usuario = [], isLoading } = useQuery({
      queryKey: ["/api/usuarios"],
      queryFn: () => api.usuarios.list(),
    });

  const onSubmit = (data: InsertUsuario) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Usuários"
        subtitle="Crie novos usuários do sistema"
      />

      <div className="p-6 overflow-y-auto h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Novo Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </Label>
                <Input
                  id="nome"
                  {...form.register("nome")}
                  placeholder="Nome do usuário"
                  data-testid="input-nome-usuario"
                />
                {form.formState.errors.nome && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil
                </Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as InsertUsuario["role"])}
                >
                  <SelectTrigger id="role" data-testid="select-role">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                    <SelectItem value={UserRole.Usuario}>Usuario</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-criar-usuario"
                >
                  {mutation.isPending ? "Salvando..." : "Criar Usuário"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <p>
          Usuários
        </p>
        <UserTable users={usuario} />
      </div>
    </div>
  );
}

