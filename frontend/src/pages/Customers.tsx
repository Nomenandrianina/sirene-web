import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Customer } from "@/types/api";

const mockCustomers: Customer[] = [
  { id: 1, name: "ONG Secours Madagascar", description: "Organisation humanitaire", createdAt: "2025-01-01", updatedAt: null, deletedAt: null, api_key: "key-001", email: "contact@secours.mg", phone: "+261340100001" },
  { id: 2, name: "Croix Rouge Mada", description: "Branche locale", createdAt: "2025-02-01", updatedAt: null, deletedAt: null, api_key: "key-002", email: "info@croixrouge.mg", phone: "+261340100002" },
];

export default function Customers() {
  const { data: customers = mockCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers(),
    placeholderData: mockCustomers,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Gestion des organisations clientes</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>API Key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{c.api_key}</Badge></TableCell>
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
