import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginData {
  nome: string;
}

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    try {
      await login(data.nome);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Usuário não encontrado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder="Nome de usuário" {...register("nome", { required: true })} />
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
