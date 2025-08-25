import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FileText, DollarSign, Package, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "../../../../shared/schema";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Pedidos", href: "/", icon: FileText },
    ...(user?.role === UserRole.Admin
      ? [
          { name: "Fluxo de Caixa", href: "/caixa", icon: DollarSign },
          { name: "Produtos", href: "/produtos", icon: Package },
          { name: "Usuários", href: "/usuarios", icon: Users },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">ERP Pedidos</h1>
        <p className="text-sm text-gray-500">Sistema de Controle</p>
      </div>
      <nav className="mt-6 flex-1">
        <ul className="space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50"
          data-testid="nav-logout"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </aside>
  );
}
