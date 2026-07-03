import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient }    from "@tanstack/react-query";
import { useNavigate }                              from "react-router-dom";
import { Bell, CheckCheck, Music, Radio, Siren ,CalendarDays, Calendar  }    from "lucide-react";
import type { LucideIcon }                          from "lucide-react"; // ← fix erreur TS
import { notificationsWebApi }                      from "@/services/notificationweb.api";
import { NotificationWeb }                          from "@/types/notificationweb";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}
  

// ─── Config par type de notification ─────────────────────────────────────────
// LucideIcon est le bon type pour les composants Lucide — résout l'erreur TS
const typeConfig: Record<string, { bg: string; color: string; icon: LucideIcon; label: string }> = {
  AUDIO_PENDING: { bg: "#fef3c7", color: "#d97706", icon: Music,  label: "Audio en attente" },
  AUDIO_APPROVED: { bg: "#d1fae5", color: "#059669", icon: Music,  label: "Audio approuvé"   },
  AUDIO_REJECTED: { bg: "#fee2e2", color: "#dc2626", icon: Music,  label: "Audio refusé"     },
  BNGRC_ALERTE:  { bg: "#fff7ed", color: "#ea580c", icon: Radio,  label: "Alerte "          },
  SIRENE_REGISTERED: { bg: "#fef9c3", color: "#ca8a04", icon: Siren,  label: "Nouvelle sirène"  },
  SOUSCRIPTION_CREATED: { bg: "#eff6ff", color: "#2563eb", icon: CalendarDays, label: "Souscription activée" },
  PLANNING_ADDED: { bg: "#f0fdf4", color: "#16a34a", icon: Calendar, label: "Planning ajouté"},
};

  
const DEFAULT_CONFIG: { bg: string; color: string; icon: LucideIcon; label: string } =
  { bg: "#f1f5f9", color: "#64748b", icon: Bell, label: "Notification" };

// ─── parseMessage ─────────────────────────────────────────────────────────────
function parseMessage(raw: string) {
  const parts = raw.split("||");
  return {
    text:         parts[0] ?? raw,
    userName:     parts[1] ?? "",
    customerName: parts[2] ?? "",
    comment:      parts[3] ?? "",
  };
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function NotificationBell() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const ref      = useRef<HTMLDivElement>(null);

  const [open,       setOpen]       = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  // ── Fermer si clic extérieur ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Poll non lues toutes les 30s ──────────────────────────────────────────
  const { data: unread = [] } = useQuery<NotificationWeb[]>({
    queryKey:        ["notifications-web-unread"],
    queryFn:         notificationsWebApi.getUnread,
    refetchInterval: 30_000,
  });

  // Badge figé quand le dropdown est ouvert, mis à jour à la fermeture
  useEffect(() => {
    if (!open) setBadgeCount(unread.length);
  }, [unread.length, open]);

  // ── Liste complète — chargée manuellement à l'ouverture ───────────────────
  const { data: all = [], refetch: refetchAll } = useQuery<NotificationWeb[]>({
    queryKey: ["notifications-web-all"],
    queryFn:  notificationsWebApi.getAll,
    enabled:  false,
  });

  // ── Ouvrir / fermer ───────────────────────────────────────────────────────

  function handleOpen() {
    const next = !open;
    setOpen(next);

    if (next) {
      refetchAll().then(() => {
        // Si des notifs non lues existent → tout marquer lu automatiquement
        qc.setQueryData<NotificationWeb[]>(
          ["notifications-web-unread"],
          (prev = []) => {
            if (prev.length > 0) {
              markAllMut.mutate(); // appel API silencieux
            }
            return prev;
          }
        );
      });
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const markReadMut = useMutation({
    mutationFn: (id: number) => notificationsWebApi.markRead(id),
    onSuccess: () => {
      // Mise à jour optimiste de la liste locale
      qc.setQueryData<NotificationWeb[]>(
        ["notifications-web-all"],
        (prev = []) => prev.map(n =>
          n.id === markReadMut.variables ? { ...n, isRead: true } : n
        ),
      );
      // Rafraîchir le count en arrière-plan
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: notificationsWebApi.markAllRead,
    onSuccess: () => {
      qc.setQueryData<NotificationWeb[]>(
        ["notifications-web-all"],
        (prev = []) => prev.map(n => ({ ...n, isRead: true })),
      );
      qc.setQueryData(["notifications-web-unread"], []); // ← vide le cache unread
      setBadgeCount(0);                                  // ← badge à 0
    },
  });

  // ── Clic sur une notification ─────────────────────────────────────────────
  const handleClick = useCallback(
    (notif: NotificationWeb) => {
      if (!notif.isRead) markReadMut.mutate(notif.id);
      if (notif.url) navigate(notif.url);
      setOpen(false);
    },
    [markReadMut, navigate],
  );

  const unreadCount = all.filter(n => !n.isRead).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* ── Bouton cloche ── */}
      <button
        className="header-icon-btn"
        aria-label="Notifications"
        onClick={handleOpen}
        style={{ position: "relative" }}
      >
        <Bell size={15} />
        {badgeCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8,
            background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 434,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 1000, overflow: "hidden",
        }}>

          {/* Header dropdown */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  background: "#eff6ff", color: "#1d4ed8",
                  fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                }}>
                  {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                  color: "#64748b", background: "none", border: "none",
                  cursor: markAllMut.isPending ? "wait" : "pointer",
                  padding: "4px 8px", borderRadius: 6, opacity: markAllMut.isPending ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!markAllMut.isPending) (e.currentTarget.style.background = "#f8fafc"); }}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <CheckCheck size={13} />
                {markAllMut.isPending ? "…" : "Tout marquer lu"}
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {all.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.4, display: "block" }} />
                <p style={{ margin: 0 }}>Aucune notification</p>
              </div>
            ) : (
              all.map(notif => {
                const cfg     = typeConfig[notif.type] ?? DEFAULT_CONFIG;
                const IconCmp = cfg.icon;
                const parsed  = parseMessage(notif.message);
                const isBngrc = notif.type === "BNGRC_ALERTE";
                const isSirene = notif.type === "SIRENE_REGISTERED";
                const isHighlighted = isBngrc || isSirene;
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 16px",
                      cursor: notif.url ? "pointer" : "default",
                      background: isUnread ? (isHighlighted ? cfg.bg : "#f8faff") : "#fff",
                      borderBottom: "1px solid #f8fafc",
                      borderLeft: isHighlighted ? `3px solid ${cfg.color}` : "3px solid transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => {
                      if (notif.url)
                        (e.currentTarget as HTMLDivElement).style.background = "#f1f5f9";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        isUnread ? (isHighlighted ? cfg.bg : "#f8faff") : "#fff";
                    }}
                  >
                    {/* Icône */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: cfg.bg,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      ...(isHighlighted && isUnread ? { animation: "notif-pulse 2s infinite" } : {}),
                    }}>
                      <IconCmp size={15} color={cfg.color} />
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badge type BNGRC / SIRENE */}
                      {isHighlighted && (
                        <div style={{ marginBottom: 3 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.06em", color: cfg.color,
                            background: cfg.bg, padding: "1px 6px", borderRadius: 6,
                          }}>
                            {isSirene ? "🚨" : "🔊"} {cfg.label}
                          </span>
                        </div>
                      )}

                      {/* Texte principal */}
                      <p style={{
                        fontSize: 13, margin: 0, lineHeight: 1.4,
                        color: isUnread ? "#0f172a" : "#475569",
                        fontWeight: isUnread ? 500 : 400,
                      }}>
                        {parsed.text}
                      </p>

                      {/* Badges expéditeur + client */}
                      {(parsed.userName || parsed.customerName) && (
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          {parsed.userName && (
                            <span style={{
                              fontSize: 10, fontWeight: 500, color: "#6366f1",
                              background: "#eef2ff", padding: "1px 7px", borderRadius: 10,
                            }}>
                              👤 {parsed.userName}
                            </span>
                          )}
                          {parsed.customerName && (
                            <span style={{
                              fontSize: 10, fontWeight: 500, color: "#0891b2",
                              background: "#ecfeff", padding: "1px 7px", borderRadius: 10,
                            }}>
                              {parsed.customerName}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Commentaire refus */}
                      {notif.type === "AUDIO_REJECTED" && parsed.comment && (
                        <p style={{
                          fontSize: 11, color: "#dc2626", background: "#fef2f2",
                          padding: "3px 8px", borderRadius: 6, margin: "4px 0 0",
                        }}>
                          {parsed.comment}
                        </p>
                      )}

                      {/* Lien d'action pour BNGRC / SIRENE */}
                      {isHighlighted && notif.url && (
                        <p style={{ fontSize: 11, color: cfg.color, margin: "3px 0 0" }}>
                          {isSirene ? "Configurer la sirène →" : "Voir sur la carte →"}
                        </p>
                      )}

                      {/* Temps */}
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Point non lu */}
                    {isUnread && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                        background: isHighlighted ? cfg.color : "#3b82f6",
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {all.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <button style={{
                fontSize: 12, color: "#3b82f6", background: "none",
                border: "none", cursor: "pointer", fontWeight: 500,
              }}>
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notif-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(234, 88, 12, 0); }
        }
      `}</style>
    </div>
  );
}