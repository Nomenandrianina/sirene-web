import { useEffect, useState } from "react";
import { Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

export interface UtilisateurFormData {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role_id: number;
  customer_id?: number | null;
  is_active?: boolean;
}

interface UtilisateurFormProps {
  initialData?: Partial<UtilisateurFormData> & { id?: number };
  onSubmit: (data: UtilisateurFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

// Noms de rôles considérés comme "superadmin" — pas besoin de client
const SUPERADMIN_ROLE_NAMES = ["superadmin", "super-admin", "super_admin", "admin"];

export function UtilisateurForm({
  initialData,
  onSubmit,
  loading,
  error,
}: UtilisateurFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles, loading: rolesLoading }     = useRoles();
  const { clients, loading: clientsLoading } = useClients();

  // L'utilisateur connecté est-il superadmin ?
  const connectedIsSuperAdmin = !!user?.role?.name?.toLowerCase().includes("admin");

  const [form, setForm] = useState<UtilisateurFormData>({
    first_name:  initialData?.first_name  ?? "",
    last_name:   initialData?.last_name   ?? "",
    email:       initialData?.email       ?? "",
    password:    "",
    role_id:     initialData?.role_id     ?? 0,
    customer_id: initialData?.customer_id ?? null,
    is_active:   initialData?.is_active   ?? true,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Sync si initialData change (cas édition async)
  useEffect(() => {
    if (initialData) {
      setForm(f => ({
        ...f,
        first_name:  initialData.first_name  ?? f.first_name,
        last_name:   initialData.last_name   ?? f.last_name,
        email:       initialData.email       ?? f.email,
        role_id:     initialData.role_id     ?? f.role_id,
        customer_id: initialData.customer_id ?? f.customer_id,
        is_active:   initialData.is_active   ?? f.is_active,
      }));
    }
  }, [initialData?.id]);

  const set = (k: keyof UtilisateurFormData, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  // Rôle sélectionné dans le formulaire
  const selectedRole = roles.find(r => r.id === Number(form.role_id));
  const selectedRoleIsSuperAdmin = selectedRole
    ? SUPERADMIN_ROLE_NAMES.some(n => selectedRole.name.toLowerCase().includes(n))
    : false;

  // Afficher le champ Client si :
  // - l'utilisateur connecté est superadmin (il peut assigner des clients)
  // - ET le rôle choisi n'est PAS superadmin (un superadmin n'a pas besoin de client)
  const showClientField = connectedIsSuperAdmin && !selectedRoleIsSuperAdmin;

  // Si le rôle passe à superadmin, on vide customer_id
  useEffect(() => {
    if (selectedRoleIsSuperAdmin) {
      set("customer_id", null);
    }
  }, [selectedRoleIsSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UtilisateurFormData = {
      first_name:  form.first_name  || undefined,
      last_name:   form.last_name   || undefined,
      email:       form.email,
      role_id:     Number(form.role_id),
      customer_id: showClientField && form.customer_id ? Number(form.customer_id) : null,
      is_active:   form.is_active,
    };
    if (!isEdit && form.password) payload.password = form.password;
    await onSubmit(payload);
  };

  return (
    <div className="form-page">

      {/* ── Breadcrumb ── */}
      <div className="form-page-header">
        <button className="btn-back" onClick={() => navigate("/utilisateurs")}>
          <ChevronLeft size={16} />
          Retour à la liste
        </button>
        <h1 className="page-title">
          {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? "Modifiez les informations de l'utilisateur"
            : "Créez un nouveau compte utilisateur"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">

        {/* ── Identité ── */}
        <div className="form-section">
          <div className="form-section-title">Identité</div>
          <div className="form-row">
            <div className="form-field">
              <label>Prénom</label>
              <input
                type="text"
                placeholder="Jean"
                value={form.first_name}
                onChange={e => set("first_name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Nom</label>
              <input
                type="text"
                placeholder="Dupont"
                value={form.last_name}
                onChange={e => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Adresse e-mail <span className="required">*</span></label>
            <input
              type="email"
              placeholder="jean@example.com"
              value={form.email}
              required
              onChange={e => set("email", e.target.value)}
            />
          </div>
        </div>

        {/* ── Sécurité ── */}
        {!isEdit && (
          <div className="form-section">
            <div className="form-section-title">Sécurité</div>
            <div className="form-field">
              <label>Mot de passe <span className="required">*</span></label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 caractères"
                  value={form.password}
                  required={!isEdit}
                  onChange={e => set("password", e.target.value)}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rôle & accès ── */}
        <div className="form-section">
          <div className="form-section-title">Rôle & accès</div>
          <div className="form-row">

            {/* Rôle */}
            <div className="form-field">
              <label>Rôle <span className="required">*</span></label>
              <select
                value={form.role_id || ""}
                required
                disabled={rolesLoading}
                onChange={e => set("role_id", Number(e.target.value))}
              >
                <option value="">— Choisir un rôle —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Client — caché si rôle superadmin sélectionné */}
            {showClientField && (
              <div className="form-field">
                <label>Client</label>
                <select
                  value={form.customer_id ?? ""}
                  disabled={clientsLoading}
                  onChange={e => set("customer_id", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— Aucun client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Message informatif quand rôle superadmin */}
          {selectedRoleIsSuperAdmin && form.role_id !== 0 && (
            <div className="form-info">
              Les superadmins ont accès à tous les clients — aucune attribution nécessaire.
            </div>
          )}

          {/* Statut — seulement en édition */}
          {isEdit && (
            <div className="form-field" style={{ maxWidth: 220 }}>
              <label>Statut</label>
              <select
                value={form.is_active ? "1" : "0"}
                onChange={e => set("is_active", e.target.value === "1")}
              >
                <option value="1">Actif</option>
                <option value="0">Inactif</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Erreur ── */}
        {error && <div className="form-error">{error}</div>}

        {/* ── Actions ── */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/utilisateurs")}
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer l'utilisateur"}
          </button>
        </div>
      </form>
    </div>
  );
}
