import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff, Radio, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import logoImg from "@/assets/logo.jpg";
import "../styles/login.css";

function RadarDot({ style }: { style: React.CSSProperties }) {
  return <span className="radar-dot" style={style} />;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const access = res.data.response.access_token;
      const refresh = res.data.response.refresh_token;
      login(access, refresh);
      navigate("/");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Identifiants invalides. Veuillez réessayer.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Background */}
      <div className="bg-map" />
      <div className="bg-grid" />
      <div className="radar-ring" />
      <div className="radar-ring" />
      <div className="radar-ring" />

      {/* Radar dots */}
      <RadarDot style={{ top: "42%", left: "18%", animationDelay: "0s" }} />
      <RadarDot style={{ top: "28%", left: "25%", animationDelay: "0.8s" }} />
      <RadarDot style={{ top: "55%", left: "22%", animationDelay: "1.5s" }} />
      <RadarDot style={{ top: "35%", left: "12%", animationDelay: "2.2s" }} />

      {/* Left panel */}
      <div className="login-left">
      <div className="brand-logo">
        <img
          src={logoImg}
          alt="MITAO Forecast-Africa"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

        
          {/* <div className="brand-text">
            <span className="brand-name">MITAO</span>
            <span className="brand-sub">Forecast-Africa</span>
          </div> */}

        <h1 className="hero-headline">
          Réseau de sirènes<br />
          <span>géolocalisées</span><br />
          à Madagascar
        </h1>

        <p className="hero-desc">
          Plateforme centralisée de gestion et de déclenchement des alertes
          vers les sirènes réparties sur l'ensemble du territoire malgache.
        </p>

        <div className="features">
          <div className="feature-item">
            <div className="feature-icon">
              <MapPin size={15} color="#5ab4e0" />
            </div>
            Suivi géolocalisé en temps réel des sirènes
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <Radio size={15} color="#f5c518" />
            </div>
            Envoi d'alertes ciblées par zone ou région
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <span style={{ fontSize: 13 }}>🌊</span>
            </div>
            Couverture nationale — cyclones, tsunamis, inondations
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="login-right">
        <div className="card">
          <div className="card-inner">
            <div className="card-header">
              <div className="card-icon">
                <Radio size={24} color="#f5c518" />
              </div>
              <div className="card-title">Sirène Web</div>
              <div className="card-desc">
                Connectez-vous pour accéder au tableau de bord
              </div>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <div className="field-group">
                <div className="field">
                  <label htmlFor="email">Adresse e-mail</label>
                  <div className="input-wrap">
                    <input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="password">Mot de passe</label>
                  <div className="input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="has-eye"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Connexion en cours…
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>

            <div className="status-bar">
              <span className="status-dot" />
              Système opérationnel · Madagascar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
