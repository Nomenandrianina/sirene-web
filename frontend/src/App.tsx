import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SendAlert from "./pages/SendAlert";
import Audios from "./pages/Audios";
import Geography from "./pages/Geography";
import NotFound from "./pages/NotFound";
import Utilisateurs from "./pages/user/Utilisateurs";
import UtilisateurCreate from "./pages/user/UtilisateurCreate";
import UtilisateurEdit from "./pages/user/UtilisateurEdit";
import RoleListe from "./pages/role/RoleListe";
import Permissions from "./pages/permission/Permissions";
import Clients from "./pages/client/Client";
import Profile from "@/pages/profile/Profile";
import ProvinceList   from "@/pages/province/ProvinceList";
import ProvinceCreate from "@/pages/province/ProvinceCreate";
import ProvinceEdit   from "@/pages/province/ProvinceEdit";
import RegionList   from "@/pages/region/RegionList";
import RegionCreate from "@/pages/region/RegionCreate";
import RegionEdit   from "@/pages/region/RegionEdit";
import DistrictList   from "@/pages/district/DistrictList";
import DistrictCreate from "@/pages/district/DistrictCreate";
import DistrictEdit   from "@/pages/district/DistrictEdit";
import VillageList   from "@/pages/village/VillageList";
import VillageCreate from "@/pages/village/VillageCreate";
import VillageEdit   from "@/pages/village/VillageEdit";
import VillageWeather from "@/pages/weather/Villageweather";
import SireneList from "@/pages/sirene/SireneList";
import SireneCreate from "@/pages/sirene/SireneCreate";
import SireneEdit   from "@/pages/sirene/SireneEdit";
import AlerteList  from "@/pages/alerte/Alertelist";
import AlerteCreate   from "@/pages/alerte/AlerteCreate";
import AlerteEdit   from "@/pages/alerte/AlerteEdit";
import AlerteTypeList from "@/pages/alerteType/AlerteTypeListe";
import AlerteTypeCreate from "@/pages/alerteType/AlerteTypeCreate";
import AlerteTypeEdit from "@/pages/alerteType/AlerteTypeEdit";
import CategorieAlerteList  from "@/pages/categorieAlerte/CategorieAlerteList";
import CategorieAlerteCreate from "@/pages/categorieAlerte/CategorieAlerteCreate";
import CategorieAlerteEdit from "@/pages/categorieAlerte/CategorieAlerteEdit";
import SousCategorieAlerteList  from "@/pages/sousCategorieAlerte/SousCategorieAlerteList";
import SousCategorieAlerteCreate from "@/pages/sousCategorieAlerte/SousCategorieAlerteCreate";
import SousCategorieAlerteEdit  from "@/pages/sousCategorieAlerte/SousCategorieAlerteEdit";
import AlerteAudioList   from "@/pages/alerteaudio/AlerteAudioList";
import AlerteAudioCreate from "@/pages/alerteaudio/AlerteAudioCreate";
import AlerteAudioEdit   from "@/pages/alerteaudio/AlerteAudioEdit";
import NotificationList   from "@/pages/notification/NotificationList";
import CommuneList   from "@/pages/commune/CommuneList";
import CommuneCreate from "./pages/commune/CommuneCreate";
import CommuneEdit from "./pages/commune/CommuneEdit";
import FokontanyList from "./pages/fokontany/FokontanyList";
import FokontanyCreate from "./pages/fokontany/FokontanyCreate";
import FokontanyEdit from "./pages/fokontany/FokontanyEdit";
import AlerteAudioChooseMode from "./pages/alerteaudio/Alerteaudiochoosemode";
import AlerteAudioRecord from "./pages/alerteaudio/Alerteaudiorecord";
import SireneMap from "./pages/sirene/SireneMap";
import PackTypeAdminPage from "./pages/packType/PackTypeAdminPage";
import MesSouscriptionsPage from "./pages/packType/MesSouscriptionsPage";
import AdminSouscriptionsPage from "./pages/souscription/Adminsouscriptionspage";
import PlanningDiffusionPage from "./pages/planning/Planningdiffusionpage";
import DiffusionConfigPage from "./pages/Parametrage/DiffusionConfig";
import MesOffres from "./pages/packType/MesOffres";
import AlerteAudioReview from "./pages/alerteaudio/AlerteAudioReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    
    <BrowserRouter>
      <AuthProvider>  
        <TooltipProvider>
          <Toaster />
          <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/alertes/envoyer" element={<ProtectedRoute><SendAlert /></ProtectedRoute>} />
              <Route path="/audios" element={<ProtectedRoute><Audios /></ProtectedRoute>} />
              <Route path="/geographie" element={<ProtectedRoute><Geography /></ProtectedRoute>} />
              <Route path="/utilisateurs" element={<ProtectedRoute adminOnly><Utilisateurs /></ProtectedRoute>} />
              <Route path="/utilisateurs/create" element={<ProtectedRoute ><UtilisateurCreate /></ProtectedRoute>} />
              <Route path="/utilisateurs/:id/edit"   element={<ProtectedRoute><UtilisateurEdit /></ProtectedRoute>} />
              <Route path="/roles"   element={<ProtectedRoute adminOnly><RoleListe /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute adminOnly><Clients /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute adminOnly><Permissions /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute ><Profile /></ProtectedRoute>} />
              <Route path="/provinces"              element={<ProtectedRoute><ProvinceList /></ProtectedRoute>} />
              <Route path="/provinces/create"       element={<ProtectedRoute><ProvinceCreate /></ProtectedRoute>} />
              <Route path="/provinces/:id/edit"     element={<ProtectedRoute><ProvinceEdit /></ProtectedRoute>} />
              <Route path="/regions"          element={<ProtectedRoute><RegionList /></ProtectedRoute>} />
              <Route path="/regions/create"   element={<ProtectedRoute><RegionCreate /></ProtectedRoute>} />
              <Route path="/regions/:id/edit" element={<ProtectedRoute><RegionEdit /></ProtectedRoute>} />
              <Route path="/districts"          element={<ProtectedRoute><DistrictList /></ProtectedRoute>} />
              <Route path="/districts/create"   element={<ProtectedRoute><DistrictCreate /></ProtectedRoute>} />
              <Route path="/districts/:id/edit" element={<ProtectedRoute><DistrictEdit /></ProtectedRoute>} />
              <Route path="/villages"          element={<ProtectedRoute><VillageList /></ProtectedRoute>} />
              <Route path="/villages/create"   element={<ProtectedRoute><VillageCreate /></ProtectedRoute>} />
              <Route path="/villages/:id/edit" element={<ProtectedRoute><VillageEdit /></ProtectedRoute>} />
              <Route path="/villages/:id/weather" element={<VillageWeather />} />
              <Route path="/sirenes"       element={<ProtectedRoute><SireneList /></ProtectedRoute>} />
              <Route path="/sirenes/create"   element={<ProtectedRoute><SireneCreate /></ProtectedRoute>} />
              <Route path="/sirenes/:id/edit" element={<ProtectedRoute><SireneEdit /></ProtectedRoute>} />
              <Route path="/alertes"       element={<ProtectedRoute><AlerteList /></ProtectedRoute>} />
              <Route path="/alertes/create"   element={<ProtectedRoute><AlerteCreate /></ProtectedRoute>} />
              <Route path="/alertes/:id/edit" element={<ProtectedRoute><AlerteEdit /></ProtectedRoute>} />
              <Route path="/alerte-types"       element={<ProtectedRoute><AlerteTypeList /></ProtectedRoute>} />
              <Route path="/alerte-types/create"   element={<ProtectedRoute><AlerteTypeCreate /></ProtectedRoute>} />
              <Route path="/alerte-types/:id/edit" element={<ProtectedRoute><AlerteTypeEdit /></ProtectedRoute>} />
              <Route path="/categorie-alertes"       element={<ProtectedRoute><CategorieAlerteList /></ProtectedRoute>} />
              <Route path="/categorie-alertes/create"   element={<ProtectedRoute><CategorieAlerteCreate /></ProtectedRoute>} />
              <Route path="/categorie-alertes/:id/edit" element={<ProtectedRoute><CategorieAlerteEdit /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes"       element={<ProtectedRoute><SousCategorieAlerteList /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes/create"   element={<ProtectedRoute><SousCategorieAlerteCreate /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes/:id/edit" element={<ProtectedRoute><SousCategorieAlerteEdit /></ProtectedRoute>} />
              <Route path="/alerte-audios"       element={<ProtectedRoute><AlerteAudioList /></ProtectedRoute>} />
              <Route path="/alerte-audios/create"   element={<ProtectedRoute><AlerteAudioChooseMode /></ProtectedRoute>} />
              <Route path="/alerte-audios/create/upload"   element={<ProtectedRoute><AlerteAudioCreate /></ProtectedRoute>} />
              <Route path="/alerte-audios/create/record"   element={<ProtectedRoute><AlerteAudioRecord /></ProtectedRoute>} />
              <Route path="/alerte-audios/:id/edit" element={<ProtectedRoute><AlerteAudioEdit /></ProtectedRoute>} />
              <Route path="/notifications"       element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
              <Route path="/communes"       element={<ProtectedRoute><CommuneList /></ProtectedRoute>} />
              <Route path="/communes/create"   element={<ProtectedRoute><CommuneCreate /></ProtectedRoute>} />
              <Route path="/communes/:id/edit" element={<ProtectedRoute><CommuneEdit /></ProtectedRoute>} />
              <Route path="/fokontany"       element={<ProtectedRoute><FokontanyList /></ProtectedRoute>} />
              <Route path="/fokontany/create"   element={<ProtectedRoute><FokontanyCreate /></ProtectedRoute>} />
              <Route path="/fokontany/:id/edit" element={<ProtectedRoute><FokontanyEdit /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><SireneMap /></ProtectedRoute>} />
              <Route path="/pack" element={<ProtectedRoute><PackTypeAdminPage /></ProtectedRoute>} />
              <Route path="/souscription" element={<ProtectedRoute><MesSouscriptionsPage /></ProtectedRoute>} />
              <Route path="/souscriptionsadmins" element={<ProtectedRoute><AdminSouscriptionsPage /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><PlanningDiffusionPage /></ProtectedRoute>} />
              <Route path="/parametrage-diffusion" element={<ProtectedRoute><DiffusionConfigPage /></ProtectedRoute>} />
              <Route path="/Offreclient" element={<ProtectedRoute><MesOffres /></ProtectedRoute>} />
              <Route path="/alerte-audios/:id/review" element={<ProtectedRoute><AlerteAudioReview /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>  
  </QueryClientProvider>
);

export default App;
