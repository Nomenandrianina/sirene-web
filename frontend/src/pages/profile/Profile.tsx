import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/services";
import { User, Lock, Building2, ShieldCheck,Pencil, Check, X, Loader2, Eye, EyeOff, } from "lucide-react";
import "@/styles/page.css";
import "@/styles/profile.css";

export default function Profile() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();

  // ── Section active ──
  const [section, setSection] = useState<"info" | "password">("info");

  // ── Infos ──
  const [editInfo, setEditInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    first_name: user?.first_name ?? "",
    last_name:  user?.last_name  ?? "",
    email:      user?.email      ?? "",
  });
  const [infoError,   setInfoError]   = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");

  const updateMut = useMutation({
    mutationFn: (data: typeof infoForm) => usersApi.updateProfile(data),
    onSuccess: (updated) => {
      setUser((prev: any) => ({ ...prev, ...updated }));
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditInfo(false);
      setInfoSuccess("Profil mis à jour avec succès.");
      setInfoError("");
      setTimeout(() => setInfoSuccess(""), 3000);
    },
    onError: (err: any) => setInfoError(err.message || "Erreur lors de la mise à jour"),
  });

  // ── Mot de passe ──
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password:     "",
    confirm_password: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [pwError,     setPwError]     = useState("");
  const [pwSuccess,   setPwSuccess]   = useState("");

  const pwMut = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwSuccess("Mot de passe modifié avec succès.");
      setPwError("");
      setTimeout(() => setPwSuccess(""), 3000);
    },
    onError: (err: any) => setPwError(err.message || "Erreur lors du changement de mot de passe"),
  });

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    pwMut.mutate({
      current_password: pwForm.current_password,
      new_password:     pwForm.new_password,
    });
  };

  // ── Helpers ──
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "—";
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Mon profil</h1>
            <p className="page-subtitle">Gérez vos informations personnelles</p>
          </div>
        </div>

        <div className="profile-layout">

          {/* ── Carte identité gauche ── */}
          <div className="profile-card-identity">
            <div className="profile-avatar-lg">{initials}</div>
            <div className="profile-identity-name">{fullName}</div>
            <div className="profile-identity-email">{user?.email}</div>

            {/* Rôle */}
            {user?.role && (
              <div className="profile-role-badge">
                <ShieldCheck size={13} />
                {user.role.name}
              </div>
            )}

            {/* Client */}
            {(user as any)?.customer && (
              <div className="profile-client-badge">
                <Building2 size={13} />
                {(user as any).customer.name}
                {(user as any).customer.company && (
                  <span className="profile-client-company">
                    · {(user as any).customer.company}
                  </span>
                )}
              </div>
            )}

            {/* Nav sections */}
            <nav className="profile-nav">
              <button
                className={`profile-nav-item${section === "info" ? " active" : ""}`}
                onClick={() => setSection("info")}
              >
                <User size={15} /> Mes informations
              </button>
              <button
                className={`profile-nav-item${section === "password" ? " active" : ""}`}
                onClick={() => setSection("password")}
              >
                <Lock size={15} /> Mot de passe
              </button>
            </nav>
          </div>

          {/* ── Contenu droite ── */}
          <div className="profile-content">

            {/* ══ Section infos ══ */}
            {section === "info" && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Informations personnelles</span>
                  {!editInfo && (
                    <button className="btn-outline-sm" onClick={() => {
                      setInfoForm({
                        first_name: user?.first_name ?? "",
                        last_name:  user?.last_name  ?? "",
                        email:      user?.email      ?? "",
                      });
                      setEditInfo(true);
                      setInfoError("");
                      setInfoSuccess("");
                    }}>
                      <Pencil size={13} /> Modifier
                    </button>
                  )}
                </div>
                <div className="panel-body">
                  {infoSuccess && <div className="form-success">{infoSuccess}</div>}

                  {editInfo ? (
                    <form onSubmit={e => {
                      e.preventDefault();
                      setInfoError("");
                      updateMut.mutate(infoForm);
                    }}>
                      <div className="form-row" style={{ marginBottom: "1rem" }}>
                        <div className="form-field">
                          <label>Prénom</label>
                          <input type="text" placeholder="Jean"
                            value={infoForm.first_name}
                            onChange={e => setInfoForm(f => ({ ...f, first_name: e.target.value }))} />
                        </div>
                        <div className="form-field">
                          <label>Nom</label>
                          <input type="text" placeholder="Dupont"
                            value={infoForm.last_name}
                            onChange={e => setInfoForm(f => ({ ...f, last_name: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-field" style={{ marginBottom: "1rem" }}>
                        <label>Email <span className="required">*</span></label>
                        <input type="email" required
                          value={infoForm.email}
                          onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      {infoError && <div className="form-error" style={{ marginBottom: "1rem" }}>{infoError}</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="submit" className="btn-primary" disabled={updateMut.isPending}>
                          {updateMut.isPending && <Loader2 size={14} className="spin" />}
                          <Check size={14} /> Enregistrer
                        </button>
                        <button type="button" className="btn-cancel"
                          onClick={() => { setEditInfo(false); setInfoError(""); }}>
                          <X size={14} /> Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-info-grid">
                      <div className="profile-info-item">
                        <span className="profile-info-label">Prénom</span>
                        <span className="profile-info-value">{user?.first_name || <em style={{ color: "var(--p-text-3)" }}>Non renseigné</em>}</span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Nom</span>
                        <span className="profile-info-value">{user?.last_name || <em style={{ color: "var(--p-text-3)" }}>Non renseigné</em>}</span>
                      </div>
                      <div className="profile-info-item" style={{ gridColumn: "span 2" }}>
                        <span className="profile-info-label">Email</span>
                        <span className="profile-info-value">{user?.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ Section mot de passe ══ */}
            {section === "password" && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Changer le mot de passe</span>
                </div>
                <div className="panel-body">
                  {pwSuccess && <div className="form-success" style={{ marginBottom: "1rem" }}>{pwSuccess}</div>}

                  <form onSubmit={handlePwSubmit}>
                    <div className="form-field" style={{ marginBottom: "1rem" }}>
                      <label>Mot de passe actuel <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <input
                          type={showCurrent ? "text" : "password"}
                          placeholder="••••••••" required
                          value={pwForm.current_password}
                          onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                        />
                        <button type="button" className="input-icon-btn"
                          onClick={() => setShowCurrent(v => !v)} tabIndex={-1}>
                          {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-row" style={{ marginBottom: "1rem" }}>
                      <div className="form-field">
                        <label>Nouveau mot de passe <span className="required">*</span></label>
                        <div className="input-with-icon">
                          <input
                            type={showNew ? "text" : "password"}
                            placeholder="Min. 6 caractères" required
                            value={pwForm.new_password}
                            onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                          />
                          <button type="button" className="input-icon-btn"
                            onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Confirmer <span className="required">*</span></label>
                        <div className="input-with-icon">
                          <input
                            type="password"
                            placeholder="Répéter le mot de passe" required
                            value={pwForm.confirm_password}
                            onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {pwError && <div className="form-error" style={{ marginBottom: "1rem" }}>{pwError}</div>}

                    <button type="submit" className="btn-primary" disabled={pwMut.isPending}>
                      {pwMut.isPending && <Loader2 size={14} className="spin" />}
                      Changer le mot de passe
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}