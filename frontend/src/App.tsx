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
import Sirenes from "./pages/Sirenes";
import Audios from "./pages/Audios";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Customers from "./pages/Customers";
import Geography from "./pages/Geography";
import NotFound from "./pages/NotFound";
import Utilisateurs from "./pages/user/Utilisateurs";
import UtilisateurCreate from "./pages/user/UtilisateurCreate";
import UtilisateurEdit from "./pages/user/UtilisateurEdit";
import RoleListe from "./pages/role/RoleListe";
import Permissions from "./pages/permission/Permissions";
import Clients from "./pages/client/Client";
import Profile from "@/pages/profile/Profile";

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
              <Route path="/sirenes" element={<ProtectedRoute><Sirenes /></ProtectedRoute>} />
              <Route path="/audios" element={<ProtectedRoute><Audios /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/geographie" element={<ProtectedRoute><Geography /></ProtectedRoute>} />
              <Route path="/utilisateurs" element={<ProtectedRoute adminOnly><Utilisateurs /></ProtectedRoute>} />
              <Route path="/utilisateurs/create" element={<ProtectedRoute ><UtilisateurCreate /></ProtectedRoute>} />
              <Route path="/utilisateurs/:id/edit"   element={<ProtectedRoute><UtilisateurEdit /></ProtectedRoute>} />
              <Route path="/roles"   element={<ProtectedRoute adminOnly><RoleListe /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute adminOnly><Clients /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute adminOnly><Permissions /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute adminOnly><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
