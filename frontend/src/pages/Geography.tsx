import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import type { Province, Region, District } from "@/types/api";

const mockProvinces: Province[] = [
  { id: 1, name: "Antananarivo" }, { id: 2, name: "Toamasina" }, { id: 3, name: "Fianarantsoa" },
  { id: 4, name: "Mahajanga" }, { id: 5, name: "Toliara" }, { id: 6, name: "Antsiranana" },
];
const mockRegions: Region[] = [
  { id: 1, name: "Analamanga", province_id: 1 }, { id: 2, name: "Vakinankaratra", province_id: 1 },
  { id: 3, name: "Atsinanana", province_id: 2 }, { id: 4, name: "Haute Matsiatra", province_id: 3 },
];
const mockDistricts: District[] = [
  { id: 1, name: "Antananarivo-Renivohitra", region_id: 1 }, { id: 2, name: "Antsirabe I", region_id: 2 },
  { id: 3, name: "Toamasina I", region_id: 3 }, { id: 4, name: "Fianarantsoa I", region_id: 4 },
];

export default function Geography() {
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  const { data: provinces = mockProvinces } = useQuery({ queryKey: ["provinces"], queryFn: () => api.getProvinces(), placeholderData: mockProvinces });
  const { data: regions = mockRegions } = useQuery({ queryKey: ["regions"], queryFn: () => api.getRegions(), placeholderData: mockRegions });
  const { data: districts = mockDistricts } = useQuery({ queryKey: ["districts"], queryFn: () => api.getDistricts(), placeholderData: mockDistricts });

  const filteredRegions = selectedProvince ? regions.filter(r => r.province_id === Number(selectedProvince)) : regions;
  const regionIds = filteredRegions.map(r => r.id);
  const filteredDistricts = selectedProvince ? districts.filter(d => regionIds.includes(d.region_id)) : districts;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Géographie</h1>
          <p className="text-muted-foreground">Hiérarchie géographique : Provinces → Régions → Districts</p>
        </div>

        <div className="max-w-xs">
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les provinces</SelectItem>
              {provinces.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Provinces
                <Badge variant="secondary">{provinces.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {provinces.map(p => (
                  <div key={p.id} className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                    selectedProvince === String(p.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`} onClick={() => setSelectedProvince(String(p.id))}>
                    {p.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Régions <Badge variant="secondary">{filteredRegions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {filteredRegions.map(r => (
                  <div key={r.id} className="px-3 py-2 rounded-md text-sm hover:bg-muted">
                    {r.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Prov. {provinces.find(p => p.id === r.province_id)?.name})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Districts <Badge variant="secondary">{filteredDistricts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {filteredDistricts.map(d => (
                  <div key={d.id} className="px-3 py-2 rounded-md text-sm hover:bg-muted">
                    {d.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Rég. {regions.find(r => r.id === d.region_id)?.name})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
