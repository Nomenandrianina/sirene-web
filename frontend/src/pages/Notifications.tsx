import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { NotificationSireneAlerte } from "@/types/api";

const mockNotifications: NotificationSireneAlerte[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  type: i % 3 === 0 ? "Automatique" : i % 3 === 1 ? "Catastrophe" : "Communication",
  operator: i % 2 === 0 ? "Telma" : "Orange",
  status: i % 4 === 3 ? "failed" : "sent",
  message: `MSG-${String(i + 1).padStart(4, "0")}`,
  sending_time: new Date(Date.now() - i * 3600000).toISOString(),
  operator_status: i % 4 === 3 ? "error" : "delivered",
  phone_number: `+2613400000${String(i).padStart(2, "0")}`,
  weather_id: 1,
  alerte_audio_id: (i % 5) + 1,
  sirene_id: (i % 5) + 1,
  sous_categorie_alerte_id: (i % 5) + 1,
  customers_id: 1,
  sending_time_after_alerte: null,
}));

export default function Notifications() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    placeholderData: { data: mockNotifications, total: mockNotifications.length },
  });

  const notifications = data?.data ?? [];
  const filtered = notifications.filter(n =>
    n.message?.toLowerCase().includes(search.toLowerCase()) ||
    n.type?.toLowerCase().includes(search.toLowerCase()) ||
    n.phone_number?.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Historique des alertes envoyées aux sirènes</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Opérateur</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Heure d'envoi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-sm">{n.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{n.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{n.message}</TableCell>
                    <TableCell className="text-sm">{n.operator}</TableCell>
                    <TableCell className="text-sm">{n.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant={n.status === "sent" ? "default" : "destructive"} className={n.status === "sent" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                        {n.status === "sent" ? "Envoyé" : "Échoué"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.sending_time ? new Date(n.sending_time).toLocaleString("fr-FR") : "-"}
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
