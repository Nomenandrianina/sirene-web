import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Index";
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
import SouscriptionsListPage from "./pages/souscription/SouscriptionsListPage";
import SouscriptionNewPage from "./pages/souscription/Souscriptionnewpage";
import AlerteBngrcList from "./pages/alertebngrc/Alertebngrclist";
import { AlerteBngrcCreate } from "./pages/alertebngrc/AlertebngrcCreate";
import { AlerteBngrcEdit } from "./pages/alertebngrc/AlertebngrcEdit";
import TypeAlerteBngrcList from "./pages/typeAlerteBngrc/TypeAlerteBngrcList";
import { TypeAlerteBngrcCreate } from "./pages/typeAlerteBngrc/TypeAlerteBngrcCreate";
import { TypeAlerteBngrcEdit } from "./pages/typeAlerteBngrc/TypeAlerteBngrcEdit";
import CategorieAlerteBngrcList from "./pages/categoriealertebngrc/CategorieAlerteBngrcList";
import { CategorieAlerteBngrcCreate } from "./pages/categoriealertebngrc/CategorieAlerteBngrcCreate";
import { CategorieAlerteBngrcEdit } from "./pages/categoriealertebngrc/CategorieAlerteBngrcEdit";
import AudioAlerteBngrcList from "./pages/audio-alerte-bngrc/AudioAlerteBngrcList";
import { AudioAlerteBngrcCreate } from "./pages/audio-alerte-bngrc/AudioAlerteBngrcCreate";
import AudioAlerteBngrcChooseMode from "./pages/audio-alerte-bngrc/AudioAlerteBngrcChooseMode";
import { AudioAlerteBngrcCreateUpload } from "./pages/audio-alerte-bngrc/AudioAlerteBngrcCreateUpload";
import AudioAlerteBngrcRecord from "./pages/audio-alerte-bngrc/AudioAlerteBngrcRecord";
import { AudioAlerteBngrcEdit } from "./pages/audio-alerte-bngrc/AudioAlerteBngrcEdit";
import SendAlerteBngrc from "./pages/alertebngrc/SendAlerteBngrc";
import NotificationBngrcList from "./pages/notification/Notificationbngrclist";
import SireneMapAlert from "./pages/dashboard/SireneMapAlert";
import SireneMapHistory from "./pages/dashboard/Sirenemaphistory";
import AlerteStory from "./pages/notification/AlerteStory";
import PlanningClientPage from "./pages/planning/Planningclientpage";

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
              <Route path="/provinces"              element={<ProtectedRoute permission="provinces:read"><ProvinceList /></ProtectedRoute>} />
              <Route path="/provinces/create"       element={<ProtectedRoute permission="provinces:create"><ProvinceCreate /></ProtectedRoute>} />
              <Route path="/provinces/:id/edit"     element={<ProtectedRoute permission="provinces:update"><ProvinceEdit /></ProtectedRoute>} />
              <Route path="/regions"          element={<ProtectedRoute permission="regions:read"><RegionList /></ProtectedRoute>} />
              <Route path="/regions/create"   element={<ProtectedRoute permission="regions:create"><RegionCreate /></ProtectedRoute>} />
              <Route path="/regions/:id/edit" element={<ProtectedRoute permission="regions:update"><RegionEdit /></ProtectedRoute>} />
              <Route path="/districts"          element={<ProtectedRoute permission="districts:read"><DistrictList /></ProtectedRoute>} />
              <Route path="/districts/create"   element={<ProtectedRoute permission="districts:create"><DistrictCreate /></ProtectedRoute>} />
              <Route path="/districts/:id/edit" element={<ProtectedRoute permission="districts:update"><DistrictEdit /></ProtectedRoute>} />
              <Route path="/villages"          element={<ProtectedRoute permission="villages:read" ><VillageList /></ProtectedRoute>} />
              <Route path="/villages/create"   element={<ProtectedRoute permission="districts:create"><VillageCreate /></ProtectedRoute>} />
              <Route path="/villages/:id/edit" element={<ProtectedRoute permission="districts:update"><VillageEdit /></ProtectedRoute>} />
              <Route path="/villages/:id/weather" element={<VillageWeather />} />
              <Route path="/sirenes"       element={<ProtectedRoute permission="sirenes:read"><SireneList /></ProtectedRoute>} />
              <Route path="/sirenes/create"   element={<ProtectedRoute permission="sirenes:create"><SireneCreate /></ProtectedRoute>} />
              <Route path="/sirenes/:id/edit" element={<ProtectedRoute permission="sirenes:update"><SireneEdit /></ProtectedRoute>} />
              <Route path="/alertes"       element={<ProtectedRoute permission="alertes:read"><AlerteList /></ProtectedRoute>} />
              <Route path="/alertes/create"   element={<ProtectedRoute permission="alertes:create"><AlerteCreate /></ProtectedRoute>} />
              <Route path="/alertes/:id/edit" element={<ProtectedRoute permission="alertes:update"><AlerteEdit /></ProtectedRoute>} />
              <Route path="/alerte-types"       element={<ProtectedRoute permission="alerte-types:read"><AlerteTypeList /></ProtectedRoute>} />
              <Route path="/alerte-types/create"   element={<ProtectedRoute permission="alerte-types:create"><AlerteTypeCreate /></ProtectedRoute>} />
              <Route path="/alerte-types/:id/edit" element={<ProtectedRoute permission="alerte-types:update"><AlerteTypeEdit /></ProtectedRoute>} />
              <Route path="/categorie-alertes"       element={<ProtectedRoute permission="categorie-alertes:read"><CategorieAlerteList /></ProtectedRoute>} />
              <Route path="/categorie-alertes/create"   element={<ProtectedRoute permission="categorie-alertes:create"><CategorieAlerteCreate /></ProtectedRoute>} />
              <Route path="/categorie-alertes/:id/edit" element={<ProtectedRoute permission="categorie-alertes:update"><CategorieAlerteEdit /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes"       element={<ProtectedRoute permission="sous-categorie-alertes:read"><SousCategorieAlerteList /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes/create"   element={<ProtectedRoute permission="sous-categorie-alertes:create"><SousCategorieAlerteCreate /></ProtectedRoute>} />
              <Route path="/sous-categorie-alertes/:id/edit" element={<ProtectedRoute permission="sous-categorie-alertes:update"><SousCategorieAlerteEdit /></ProtectedRoute>} />
              <Route path="/alerte-audios"       element={<ProtectedRoute permission="alerte-audios:read"><AlerteAudioList /></ProtectedRoute>} />
              <Route path="/alerte-audios/create"   element={<ProtectedRoute permission="alerte-audios:create"><AlerteAudioChooseMode /></ProtectedRoute>} />
              <Route path="/alerte-audios/create/upload"   element={<ProtectedRoute permission="alerte-audios:create"><AlerteAudioCreate /></ProtectedRoute>} />
              <Route path="/alerte-audios/create/record"   element={<ProtectedRoute permission="alerte-audios:create"><AlerteAudioRecord /></ProtectedRoute>} />
              <Route path="/alerte-audios/:id/edit" element={<ProtectedRoute permission="alerte-audios:update"><AlerteAudioEdit /></ProtectedRoute>} />
              <Route path="/notifications"       element={<ProtectedRoute permission="notifications:read"><NotificationList /></ProtectedRoute>} />
              <Route path="/communes"       element={<ProtectedRoute permission="communes:read"><CommuneList /></ProtectedRoute>} />
              <Route path="/communes/create"   element={<ProtectedRoute permission="communes:create"><CommuneCreate /></ProtectedRoute>} />
              <Route path="/communes/:id/edit" element={<ProtectedRoute permission="communes:update"><CommuneEdit /></ProtectedRoute>} />
              <Route path="/fokontany"       element={<ProtectedRoute permission="fokontany:read"><FokontanyList /></ProtectedRoute>} />
              <Route path="/fokontany/create"   element={<ProtectedRoute permission="fokontany:create"><FokontanyCreate /></ProtectedRoute>} />
              <Route path="/fokontany/:id/edit" element={<ProtectedRoute permission="fokontany:update"><FokontanyEdit /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute permission="sirene-map:read"><SireneMap /></ProtectedRoute>} />
              <Route path="/pack" element={<ProtectedRoute permission="pack-types:read"><PackTypeAdminPage /></ProtectedRoute>} />
              <Route path="/souscription" element={<ProtectedRoute permission="souscriptions:read"><SouscriptionsListPage /></ProtectedRoute>} />
              <Route path="/souscription/new" element={<ProtectedRoute permission="souscriptions:create"><SouscriptionNewPage /></ProtectedRoute>} />
              {/* <Route path="/souscriptionsadmins" element={<ProtectedRoute><SouscriptionsListPage /></ProtectedRoute>} /> */}
              <Route path="/planning" element={<ProtectedRoute permission="planning:read"><PlanningDiffusionPage /></ProtectedRoute>} />
              <Route path="/planning-customer" element={<ProtectedRoute permission="planning:read-customer"><PlanningClientPage /></ProtectedRoute>} />
              
              <Route path="/parametrage-diffusion" element={<ProtectedRoute adminOnly><DiffusionConfigPage /></ProtectedRoute>} />
              <Route path="/Offreclient" element={<ProtectedRoute permission="offre:read"><MesOffres  /></ProtectedRoute>} />
              <Route path="/alerte-audios/:id/review" element={<ProtectedRoute permission="alerte-audios:review"><AlerteAudioReview /></ProtectedRoute>} />

              <Route path="/alertebngrc"       element={<ProtectedRoute permission="alertebngrc:read"><AlerteBngrcList /></ProtectedRoute>} />
              <Route path="/alertebngrc/create"   element={<ProtectedRoute permission="alertebngrc:create"><AlerteBngrcCreate /></ProtectedRoute>} />
              <Route path="/alertebngrc/:id/edit" element={<ProtectedRoute permission="alertebngrc:update"><AlerteBngrcEdit /></ProtectedRoute>} />
              
              <Route path="/typealertebngrc"       element={<ProtectedRoute permission="typealertebngrc:read"><TypeAlerteBngrcList /></ProtectedRoute>} />
              <Route path="/typealertebngrc/create"   element={<ProtectedRoute permission="typealertebngrc:create"><TypeAlerteBngrcCreate /></ProtectedRoute>} />
              <Route path="/typealertebngrc/:id/edit" element={<ProtectedRoute permission="typealertebngrc:update"><TypeAlerteBngrcEdit /></ProtectedRoute>} />
              
              <Route path="/categorie-alerte-bngrc"       element={<ProtectedRoute permission="categorie-alerte-bngrc:read"><CategorieAlerteBngrcList /></ProtectedRoute>} />
              <Route path="/categorie-alerte-bngrc/create"   element={<ProtectedRoute permission="categorie-alerte-bngrc:create"><CategorieAlerteBngrcCreate /></ProtectedRoute>} />
              <Route path="/categorie-alerte-bngrc/:id/edit" element={<ProtectedRoute permission="categorie-alerte-bngrc:update"><CategorieAlerteBngrcEdit /></ProtectedRoute>} />
              
              <Route path="/audio-alerte-catastrophe"       element={<ProtectedRoute permission="audio-alerte-bngrc:read"><AudioAlerteBngrcList /></ProtectedRoute>} />
              <Route path="/audio-alerte-catastrophe/create"   element={<ProtectedRoute permission="audio-alerte-bngrc:create"><AudioAlerteBngrcChooseMode /></ProtectedRoute>} />
              <Route path="/audio-alerte-catastrophe/create/upload"   element={<ProtectedRoute permission="audio-alerte-bngrc:create"><AudioAlerteBngrcCreateUpload /></ProtectedRoute>} />
              <Route path="/audio-alerte-catastrophe/create/record"   element={<ProtectedRoute permission="audio-alerte-bngrc:create"><AudioAlerteBngrcRecord /></ProtectedRoute>} />
              <Route path="/audio-alerte-catastrophe/:id/edit"   element={<ProtectedRoute permission="audio-alerte-bngrc:update"><AudioAlerteBngrcEdit /></ProtectedRoute>} />
             
              <Route path="/sendalerte-all"   element={<ProtectedRoute permission="alerte-bngrc:send"><SendAlerteBngrc /></ProtectedRoute>} />
              <Route path="/notifications-alerte"   element={<ProtectedRoute permission="notification-bngrc:read"><NotificationBngrcList /></ProtectedRoute>} />
              <Route path="/sirene-map-alert"   element={<ProtectedRoute permission="sirene-map-alert:read"><SireneMapAlert /></ProtectedRoute>} />
              <Route path="/sirene-map-alert-history"   element={<ProtectedRoute permission="sirene-map-alert:story"><SireneMapHistory /></ProtectedRoute>} />
              <Route path="/alert-history"   element={<ProtectedRoute permission="sirene-map-alert:story"><AlerteStory /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>  
  </QueryClientProvider>
);

export default App;
