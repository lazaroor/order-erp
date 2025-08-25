import { Usuario } from "../../../../shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: Usuario[];
}

export default function UserTable({ users }: UserTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nome}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  Nenhum usuário cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}