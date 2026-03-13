// components/AvatarUpload.tsx
// Zone upload/suppression avatar dans la page profil
import { useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { avatarApi } from "@/services/users.api";
import { UserAvatar } from "@/components/utilisateur/Useravatar";

interface AvatarUploadProps {
  user: {
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  };
  onUpdated: (avatarUrl: string | null) => void;
}

export function AvatarUpload({ user, onUpdated }: AvatarUploadProps) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");
  const [preview, setPreview]   = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local immédiat
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setError("");
    try {
      const res = await avatarApi.upload(file);
      setPreview(null);
      onUpdated(res.avatar_url);
    } catch (err: any) {
      setPreview(null);
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!user.avatar_url) return;
    setLoading(true);
    setError("");
    try {
      await avatarApi.remove();
      onUpdated(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const displayUrl = preview
    ? undefined // preview est une data URL, gérée séparément
    : user.avatar_url ?? undefined;

  return (
    <div className="avatar-upload-wrap">
      {/* Avatar avec overlay */}
      <div className="avatar-upload-container">
        {preview ? (
          <img src={preview} alt="preview"
            style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover" }} />
        ) : (
          <UserAvatar
            avatarUrl={displayUrl}
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
            size="lg"
          />
        )}

        {/* Overlay caméra */}
        <button
          type="button"
          className="avatar-camera-btn"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          title="Changer la photo"
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
        </button>
      </div>

      {/* Input caché */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Bouton supprimer */}
      {user.avatar_url && !loading && (
        <button
          type="button"
          className="avatar-delete-btn"
          onClick={handleDelete}
          title="Supprimer la photo"
        >
          <Trash2 size={13} />
          Supprimer
        </button>
      )}

      {/* Contraintes */}
      <span className="avatar-hint">JPG, PNG, WebP · max 2 Mo</span>

      {error && <div className="form-error" style={{ marginTop: 4 }}>{error}</div>}
    </div>
  );
}