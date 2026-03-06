import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Volume2 } from "lucide-react";
import type { AlerteAudio } from "@/types/api";

const mockAudios: AlerteAudio[] = [
  { id: 1, name: "Cyclone J-1", description: "Alerte cyclone 1 jour avant", sous_categorie_alerte_id: 1, audio: null },
  { id: 2, name: "Cyclone J-2", description: "Alerte cyclone 2 jours avant", sous_categorie_alerte_id: 2, audio: null },
  { id: 3, name: "Cyclone J-3", description: "Alerte cyclone 3 jours avant", sous_categorie_alerte_id: 3, audio: null },
  { id: 4, name: "Inondation J-1", description: "Alerte inondation 1 jour avant", sous_categorie_alerte_id: 4, audio: null },
  { id: 5, name: "Sensibilisation", description: "Message de prévention", sous_categorie_alerte_id: 5, audio: null },
];

export default function Audios() {
  const { data: audios = mockAudios } = useQuery({
    queryKey: ["audios"],
    queryFn: () => api.getAlerteAudios(),
    placeholderData: mockAudios,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichiers Audio</h1>
          <p className="text-muted-foreground">Gestion des audios associés aux sous-catégories d'alerte</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sous-catégorie ID</TableHead>
                  <TableHead>Audio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audios.map(a => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="outline">{a.id}</Badge></TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.description}</TableCell>
                    <TableCell><Badge variant="secondary">{a.sous_categorie_alerte_id}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-xs">{a.audio ? "Disponible" : "Non défini"}</span>
                      </div>
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
