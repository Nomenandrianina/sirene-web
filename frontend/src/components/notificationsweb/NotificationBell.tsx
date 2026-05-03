// src/components/NotificationBell.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Music } from "lucide-react";
import { notificationsWebApi } from "@/services/notificationweb.api";
import { NotificationWeb } from "@/types/notificationweb";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

const typeIcon: Record<string, { bg: string; color: string }> = {
  AUDIO_PENDING:  { bg: "#fef3c7", color: "#d97706" },
  AUDIO_APPROVED: { bg: "#d1fae5", color: "#059669" },
  AUDIO_REJECTED: { bg: "#fee2e2", color: "#dc2626" },
};

function parseMessage(raw: string): {text:string; userName: string; customerName: string; comment: string;} {
  const parts        = raw.split('||');
  return {
    text:         parts[0] ?? raw,
    userName:     parts[1] ?? '',
    customerName: parts[2] ?? '',
    comment:      parts[3] ?? '',
  };
}

export function NotificationBell() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [open, setOpen]           = useState(false);
  const [badgeCount, setBadgeCount] = useState(0); // ← snapshot du count
  const ref = useRef<HTMLDivElement>(null);

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll toutes les 30 secondes
  const { data: unread = [] } = useQuery({
    queryKey:        ["notifications-web-unread"],
    queryFn:         notificationsWebApi.getUnread,
    refetchInterval: 30_000,
  });

  // ← Mettre à jour le badge uniquement quand le dropdown est FERMÉ
  useEffect(() => {
    if (!open) {
      setBadgeCount(unread.length);
    }
  }, [unread.length, open]);

  // Toutes les notifs — chargées manuellement à l'ouverture
  const { data: all = [], refetch: refetchAll } = useQuery({
    queryKey: ["notifications-web-all"],
    queryFn:  notificationsWebApi.getAll,
    enabled:  false, // ← contrôle manuel
  });

  // ← Ouvrir/fermer + charger la liste à l'ouverture
  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) refetchAll();
  }

  const markReadMut = useMutation({
    mutationFn: (id: number) => notificationsWebApi.markRead(id),
    onSuccess:  () => {
      // Invalider en arrière-plan — badge se met à jour à la fermeture
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
      // Rafraîchir la liste pour mettre à jour le point bleu uniquement
      refetchAll();
    },
  });

  const markAllMut = useMutation({
    mutationFn: notificationsWebApi.markAllRead,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
      refetchAll();
    },
  });

  const handleClick = useCallback((notif: NotificationWeb) => {
    if (!notif.isRead) markReadMut.mutate(notif.id);
    if (notif.url) navigate(notif.url);
    setOpen(false);
  }, [markReadMut, navigate]);

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* ── Bouton cloche ── */}
      <button
        className="header-icon-btn"
        aria-label="Notifications"
        onClick={handleOpen}  // ← handleOpen au lieu de setOpen direct
        style={{ position: "relative" }}
      >
        <Bell size={15} />
        {badgeCount > 0 && (  // ← badgeCount (snapshot) au lieu de unreadCount
          <span style={{
            position:       "absolute",
            top:            -4,
            right:          -4,
            minWidth:       16,
            height:         16,
            padding:        "0 4px",
            borderRadius:   8,
            background:     "#ef4444",
            color:          "#fff",
            fontSize:       10,
            fontWeight:     700,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            lineHeight:     1,
          }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 8px)",
          right:        0,
          width:        434,
          background:   "#fff",
          border:       "1px solid #e2e8f0",
          borderRadius: 12,
          boxShadow:    "0 8px 32px rgba(0,0,0,0.12)",
          zIndex:       200,
          overflow:     "hidden",
        }}>

          {/* Header dropdown */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "14px 16px",
            borderBottom:   "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                Notifications
              </span>
              {/* ← Compter les non lues depuis `all` (liste courante) */}
              {all.filter(n => !n.isRead).length > 0 && (
                <span style={{
                  background:   "#eff6ff",
                  color:        "#1d4ed8",
                  fontSize:     11,
                  fontWeight:   600,
                  padding:      "2px 7px",
                  borderRadius: 10,
                }}>
                  {all.filter(n => !n.isRead).length} nouvelle{all.filter(n => !n.isRead).length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {/* ← Bouton visible si au moins une non lue dans la liste */}
            {all.some(n => !n.isRead) && (
              <button
                onClick={() => markAllMut.mutate()}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          4,
                  fontSize:     11,
                  color:        "#64748b",
                  background:   "none",
                  border:       "none",
                  cursor:       "pointer",
                  padding:      "4px 8px",
                  borderRadius: 6,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <CheckCheck size={13} />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {all.length === 0 ? (
              <div style={{
                padding:   "32px 16px",
                textAlign: "center",
                color:     "#94a3b8",
                fontSize:  13,
              }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <p>Aucune notification</p>
              </div>
            ) : (
              all.map(notif => {
                const iconCfg = typeIcon[notif.type] ?? { bg: "#f1f5f9", color: "#64748b" };
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display:      "flex",
                      alignItems:   "flex-start",
                      gap:          12,
                      padding:      "12px 16px",
                      cursor:       notif.url ? "pointer" : "default",
                      background:   notif.isRead ? "#fff" : "#f8faff",
                      borderBottom: "1px solid #f8fafc",
                      transition:   "background 0.1s",
                    }}
                    onMouseEnter={e => {
                      if (notif.url)
                        (e.currentTarget as HTMLDivElement).style.background = "#f1f5f9";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        notif.isRead ? "#fff" : "#f8faff";
                    }}
                  >
                    {/* Icône type */}
                    <div style={{
                      width:          34,
                      height:         34,
                      borderRadius:   8,
                      background:     iconCfg.bg,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      flexShrink:     0,
                    }}>
                      <Music size={15} style={{ color: iconCfg.color }} />
                    </div>

                    {/* Contenu */}
                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                    {(() => {
                      const parsed = parseMessage(notif.message);
                      return (
                        <>
                          {/* Message principal */}
                          <p style={{
                            fontSize:   13,
                            color:      notif.isRead ? "#475569" : "#0f172a",
                            fontWeight: notif.isRead ? 400 : 500,
                            margin:     0,
                            lineHeight: 1.4,
                          }}>
                            {parsed.text}
                          </p>

                          {/* Badges user + client */}
                          {(parsed.userName || parsed.customerName) && (
                            <div style={{
                              display:   "flex",
                              gap:       6,
                              marginTop: 4,
                              flexWrap:  "wrap",
                            }}>
                              {parsed.userName && (
                                <span style={{
                                  fontSize:     10,
                                  fontWeight:   500,
                                  color:        "#6366f1",
                                  background:   "#eef2ff",
                                  padding:      "1px 7px",
                                  borderRadius: 10,
                                }}>
                                  {parsed.userName}
                                </span>
                              )}
                              {parsed.customerName && (
                                <span style={{
                                  fontSize:     10,
                                  fontWeight:   500,
                                  color:        "#0891b2",
                                  background:   "#ecfeff",
                                  padding:      "1px 7px",
                                  borderRadius: 10,
                                }}>
                                  {parsed.customerName}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Commentaire de refus */}
                          {notif.type === 'AUDIO_REJECTED' && parsed.comment && (
                            <p style={{
                              fontSize:     11,
                              color:        "#dc2626",
                              background:   "#fef2f2",
                              padding:      "3px 8px",
                              borderRadius: 6,
                              margin:       "4px 0 0",
                            }}>
                              {parsed.comment}
                            </p>
                          )}

                          {/* Temps */}
                          <p style={{
                            fontSize: 11,
                            color:    "#94a3b8",
                            margin:   "3px 0 0",
                          }}>
                            {timeAgo(notif.createdAt)}
                          </p>
                        </>
                      );
                    })()}

                    </div>

                    {/* Point non lu */}
                    {!notif.isRead && (
                      <div style={{
                        width:        7,
                        height:       7,
                        borderRadius: "50%",
                        background:   "#3b82f6",
                        flexShrink:   0,
                        marginTop:    4,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {all.length > 0 && (
            <div style={{
              padding:   "10px 16px",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
            }}>
              <button
                onClick={() => { navigate("/notifications"); setOpen(false); }}
                style={{
                  fontSize:   12,
                  color:      "#3b82f6",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  fontWeight: 500,
                }}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}