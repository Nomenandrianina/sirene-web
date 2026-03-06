import {
  createContext, useContext, useState,
  useEffect, ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

interface Role {
  name: string;
  permissions: { name: string }[];
}

interface User {
  id?: number;
  last_name?: string;
  first_name?: string;
  email: string;
  number?: string;
  country?: string;
  state?: string;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: any) => void;
  updateUser: (data: any) => Promise<string>;
  signUp: (data: any) => Promise<string>;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  forgotPassword: (email: string) => Promise<{ data: any; error: any }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ data: any; error: any }>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;   // ← ajouté
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Nom de clé unique et cohérent partout
const TOKEN_KEY   = "access_token";
const REFRESH_KEY = "refresh_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  // ── isSuperAdmin : true si le rôle contient "admin" (insensible à la casse)
  const isSuperAdmin = !!user?.role?.name?.toLowerCase().includes("superadmin");

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("auth_user");
    setUser(null);
    navigate("/login");
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      const res = await api.get("/users/profile");
      setUser(res.data.response);
    } catch {
      // Token invalide ou expiré → déconnexion silencieuse
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    await loadUser();
    navigate("/");
  };

  const updateUser = async (data: any) => {
    try {
      const res = await api.put("/users/update-profile", data);
      setUser(res.data.response);
      return res.data.message;
    } catch (error) {
      console.error("Erreur update profile", error);
    }
  };

  const signUp = async (data: any) => {
    try {
      const res = await api.post("/users/signup", data);
      return res.data.message;
    } catch (error: any) {
      throw { code: error.response?.data?.code || "default" };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const result = await api.put("/users/change-password", { currentPassword, newPassword });
      return { data: result.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.response?.data || { message: "Something went wrong" } };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const result = await api.post("/auth/forgot-password", { email });
      return { data: result.data, error: null };
    } catch (error: any) {
      return { data: null, error: { code: error.response?.data?.code || "default" } };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const result = await api.post("/auth/reset-password", { token, newPassword });
      return { data: result.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.response?.data || { message: "Something went wrong" } };
    }
  };

  useEffect(() => { loadUser(); }, []);

  return (
    <AuthContext.Provider value={{
      user, setUser,
      updateUser, signUp, login, logout,
      updatePassword, forgotPassword, resetPassword,
      isAuthenticated: !!user,
      isSuperAdmin,          // ← exposé
      loading,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
