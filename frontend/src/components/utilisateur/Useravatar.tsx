// components/UserAvatar.tsx
// Composant réutilisable — affiche photo ou initiales
import { avatarApi } from "@/services/users.api";

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: 32, font: "0.72rem", radius: "8px" },
  md: { box: 40, font: "0.85rem", radius: "10px" },
  lg: { box: 72, font: "1.5rem",  radius: "18px" },
};

export function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const { box, font, radius } = sizeMap[size];

  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean).join("").toUpperCase()
    || email?.[0]?.toUpperCase() || "?";

  const fullUrl = avatarApi.getUrl(avatarUrl);

  const style: React.CSSProperties = {
    width: box, height: box,
    borderRadius: radius,
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: font,
  };

  if (fullUrl) {
    return (
      <div style={style} className={className}>
        <img
          src={fullUrl}
          alt={`${firstName} ${lastName}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => {
            // Si image cassée → fallback initiales
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.style.background = "#1a35a0";
            (e.target as HTMLImageElement).parentElement!.style.color = "#fff";
            (e.target as HTMLImageElement).parentElement!.textContent = initials;
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...style, background: "#1a35a0", color: "#fff" }} className={className}>
      {initials}
    </div>
  );
}