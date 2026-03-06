import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User } from "@/types/api";

const mockUsers: User[] = [
  { id: 1, full_name: "Admin Principal", email: "admin@sirene.mg", role_id: 1, is_active: true, created_at: "2025-01-01", customers_id: null, role: { id: 1, name: "superadmin", created_at: "" } },
  { id: 2, full_name: "Jean Rakoto", email: "jean@client1.mg", role_id: 2, is_active: true, created_at: "2025-02-01", customers_id: 1, role: { id: 2, name: "client", created_at: "" } },
  { id: 3, full_name: "Marie Rabe", email: "marie@client2.mg", role_id: 2, is_active: true, created_at: "2025-03-01", customers_id: 2, role: { id: 2, name: "client", created_at: "" } },
];

export default function Users() {
  const { data: users = mockUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    placeholderData: mockUsers,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des comptes utilisateurs</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.role?.name}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.customers_id ? `Client #${u.customers_id}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "secondary"} className={u.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                        {u.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
