import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Send, Loader2, CheckCircle, AlertTriangle, Radio } from "lucide-react";
import type { Alerte, AlerteType, CategorieAlerte, SousCategorieAlerte, Province, Region, District, Sirene } from "@/types/api";

const STEPS = ["Alerte", "Type", "Catégorie", "Sous-catégorie", "Zones", "Planification", "Confirmation"];

const mockAlertes: Alerte[] = [
  { id: 1, name: "Catastrophe naturelle", customers_id: 1 },
  { id: 2, name: "Communication communautaire", customers_id: 1 },
];
const mockTypes: AlerteType[] = [
  { id: 1, name: "Cyclone", Alerte_id: 1 },
  { id: 2, name: "Inondation", Alerte_id: 1 },
  { id: 3, name: "Sensibilisation", Alerte_id: 2 },
];
const mockCategories: CategorieAlerte[] = [
  { id: 1, name: "Temps estimé d'impact", alerte_type_id: 1 },
  { id: 2, name: "Temps estimé d'impact", alerte_type_id: 2 },
  { id: 3, name: "Type de communication", alerte_type_id: 3 },
];
const mockSousCategories: SousCategorieAlerte[] = [
  { id: 1, name: "1 jour avant danger", categorie_alerte_id: 1, alerte_id: 1, alerte_type_id: 1 },
  { id: 2, name: "2 jours avant danger", categorie_alerte_id: 1, alerte_id: 1, alerte_type_id: 1 },
  { id: 3, name: "3 jours avant danger", categorie_alerte_id: 1, alerte_id: 1, alerte_type_id: 1 },
  { id: 4, name: "1 jour avant danger", categorie_alerte_id: 2, alerte_id: 1, alerte_type_id: 2 },
  { id: 5, name: "Message de prévention", categorie_alerte_id: 3, alerte_id: 2, alerte_type_id: 3 },
];
const mockProvinces: Province[] = [
  { id: 1, name: "Antananarivo" },
  { id: 2, name: "Toamasina" },
  { id: 3, name: "Fianarantsoa" },
];
const mockRegions: Region[] = [
  { id: 1, name: "Analamanga", province_id: 1 },
  { id: 2, name: "Atsinanana", province_id: 2 },
];
const mockDistricts: District[] = [
  { id: 1, name: "Antananarivo-Renivohitra", region_id: 1 },
  { id: 2, name: "Toamasina I", region_id: 2 },
];
const mockSirenes: Sirene[] = [
  { id: 1, imei: "SRN001", latitude: "-18.91", longitude: "47.52", phone_number_brain: "+261340001", phone_number_relai: "+261340002", village_id: 1, is_active: true },
  { id: 2, imei: "SRN002", latitude: "-18.15", longitude: "49.40", phone_number_brain: "+261340003", phone_number_relai: "+261340004", village_id: 2, is_active: true },
  { id: 3, imei: "SRN003", latitude: "-19.85", longitude: "47.03", phone_number_brain: "+261340005", phone_number_relai: "+261340006", village_id: 3, is_active: false },
];

const SCHEDULE_OPTIONS = [
  { value: "now", label: "Maintenant" },
  { value: "1h", label: "Dans 1 heure" },
  { value: "2h", label: "Dans 2 heures" },
  { value: "3h", label: "Dans 3 heures" },
  { value: "6h", label: "Dans 6 heures" },
  { value: "12h", label: "Dans 12 heures" },
  { value: "24h", label: "Dans 24 heures" },
];

export default function SendAlert() {
  const [step, setStep] = useState(0);
  const [alerteId, setAlerteId] = useState<number | null>(null);
  const [alerteTypeId, setAlerteTypeId] = useState<number | null>(null);
  const [categorieId, setCategorieId] = useState<number | null>(null);
  const [sousCategorieId, setSousCategorieId] = useState<number | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<number[]>([]);
  const [schedule, setSchedule] = useState("now");
  const { toast } = useToast();

  // Queries with mock fallback
  const { data: alertes = mockAlertes } = useQuery({ queryKey: ["alertes"], queryFn: () => api.getAlertes(), placeholderData: mockAlertes });
  const { data: types = [] } = useQuery({
    queryKey: ["alerte-types", alerteId],
    queryFn: () => api.getAlerteTypes(alerteId!),
    enabled: !!alerteId,
    placeholderData: mockTypes.filter(t => t.Alerte_id === alerteId),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", alerteTypeId],
    queryFn: () => api.getCategorieAlertes(alerteTypeId!),
    enabled: !!alerteTypeId,
    placeholderData: mockCategories.filter(c => c.alerte_type_id === alerteTypeId),
  });
  const { data: sousCategories = [] } = useQuery({
    queryKey: ["sous-categories", categorieId],
    queryFn: () => api.getSousCategorieAlertes(categorieId!),
    enabled: !!categorieId,
    placeholderData: mockSousCategories.filter(sc => sc.categorie_alerte_id === categorieId),
  });
  const { data: provinces = mockProvinces } = useQuery({ queryKey: ["provinces"], queryFn: () => api.getProvinces(), placeholderData: mockProvinces });
  const { data: regions = mockRegions } = useQuery({ queryKey: ["regions"], queryFn: () => api.getRegions(), placeholderData: mockRegions });
  const { data: districts = mockDistricts } = useQuery({ queryKey: ["districts"], queryFn: () => api.getDistricts(), placeholderData: mockDistricts });

  const filteredRegions = selectedProvinces.length > 0 ? regions.filter(r => selectedProvinces.includes(r.province_id)) : regions;
  const filteredDistricts = selectedRegions.length > 0 ? districts.filter(d => selectedRegions.includes(d.region_id)) : districts;

  const sendMutation = useMutation({
    mutationFn: (data: any) => api.sendAlert(data),
    onSuccess: () => {
      toast({ title: "Alerte envoyée", description: "L'alerte a été envoyée avec succès" });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setStep(0);
    setAlerteId(null);
    setAlerteTypeId(null);
    setCategorieId(null);
    setSousCategorieId(null);
    setSelectedProvinces([]);
    setSelectedRegions([]);
    setSelectedDistricts([]);
    setSchedule("now");
  };

  const getScheduledTime = (): string | null => {
    if (schedule === "now") return null;
    const hours = parseInt(schedule);
    return new Date(Date.now() + hours * 3600000).toISOString();
  };

  const handleSend = () => {
    sendMutation.mutate({
      alerte_id: alerteId,
      alerte_type_id: alerteTypeId,
      categorie_alerte_id: categorieId,
      sous_categorie_alerte_id: sousCategorieId,
      sirene_ids: mockSirenes.filter(s => s.is_active).map(s => s.id),
      scheduled_time: getScheduledTime(),
    });
  };

  const canNext = () => {
    switch (step) {
      case 0: return alerteId !== null;
      case 1: return alerteTypeId !== null;
      case 2: return categorieId !== null;
      case 3: return sousCategorieId !== null;
      case 4: return selectedProvinces.length > 0 || selectedRegions.length > 0 || selectedDistricts.length > 0;
      case 5: return !!schedule;
      default: return true;
    }
  };

  const selectedAlerte = alertes.find(a => a.id === alerteId);
  const selectedType = types.find(t => t.id === alerteTypeId);
  const selectedCategorie = categories.find(c => c.id === categorieId);
  const selectedSousCategorie = sousCategories.find(sc => sc.id === sousCategorieId);

  const toggleArrayItem = (arr: number[], setArr: React.Dispatch<React.SetStateAction<number[]>>, id: number) => {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Envoyer une alerte</h1>
          <p className="text-muted-foreground">Suivez les étapes pour configurer et envoyer une alerte</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Sélectionnez le type d'alerte à envoyer"}
              {step === 1 && "Choisissez le type spécifique d'alerte"}
              {step === 2 && "Sélectionnez la catégorie"}
              {step === 3 && "Choisissez la sous-catégorie (message audio associé)"}
              {step === 4 && "Sélectionnez les zones géographiques cibles"}
              {step === 5 && "Planifiez l'heure d'envoi"}
              {step === 6 && "Vérifiez et confirmez l'envoi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {alertes.map(a => (
                  <button key={a.id} onClick={() => { setAlerteId(a.id); setAlerteTypeId(null); setCategorieId(null); setSousCategorieId(null); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${alerteId === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <AlertTriangle className={`h-5 w-5 mb-2 ${alerteId === a.id ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">{a.name}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(types.length > 0 ? types : mockTypes.filter(t => t.Alerte_id === alerteId)).map(t => (
                  <button key={t.id} onClick={() => { setAlerteTypeId(t.id); setCategorieId(null); setSousCategorieId(null); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${alerteTypeId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <p className="font-medium">{t.name}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3">
                {(categories.length > 0 ? categories : mockCategories.filter(c => c.alerte_type_id === alerteTypeId)).map(c => (
                  <button key={c.id} onClick={() => { setCategorieId(c.id); setSousCategorieId(null); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${categorieId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <p className="font-medium">{c.name}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(sousCategories.length > 0 ? sousCategories : mockSousCategories.filter(sc => sc.categorie_alerte_id === categorieId)).map(sc => (
                  <button key={sc.id} onClick={() => setSousCategorieId(sc.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${sousCategorieId === sc.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <p className="font-medium">{sc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Audio ID: {sc.id}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Provinces</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {provinces.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent/50 cursor-pointer">
                        <Checkbox checked={selectedProvinces.includes(p.id)} onCheckedChange={() => toggleArrayItem(selectedProvinces, setSelectedProvinces, p.id)} />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Régions</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {filteredRegions.map(r => (
                      <label key={r.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent/50 cursor-pointer">
                        <Checkbox checked={selectedRegions.includes(r.id)} onCheckedChange={() => toggleArrayItem(selectedRegions, setSelectedRegions, r.id)} />
                        <span className="text-sm">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Districts</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {filteredDistricts.map(d => (
                      <label key={d.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent/50 cursor-pointer">
                        <Checkbox checked={selectedDistricts.includes(d.id)} onCheckedChange={() => toggleArrayItem(selectedDistricts, setSelectedDistricts, d.id)} />
                        <span className="text-sm">{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {mockSirenes.filter(s => s.is_active).length} sirènes actives dans les zones sélectionnées
                  </span>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-sm">
                <Select value={schedule} onValueChange={setSchedule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir l'heure d'envoi" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Alerte</p>
                    <p className="font-medium">{selectedAlerte?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedType?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Catégorie</p>
                    <p className="font-medium">{selectedCategorie?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Sous-catégorie</p>
                    <p className="font-medium">{selectedSousCategorie?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Zones</p>
                    <p className="font-medium">
                      {selectedProvinces.length} provinces, {selectedRegions.length} régions, {selectedDistricts.length} districts
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Planification</p>
                    <p className="font-medium">{SCHEDULE_OPTIONS.find(o => o.value === schedule)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <span className="text-sm">L'audio ID <Badge variant="secondary">{sousCategorieId}</Badge> sera envoyé aux sirènes via SMS</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Suivant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={sendMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer l'alerte
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
