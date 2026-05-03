export interface NotificationWeb {
  id:         number;
  type:       string;
  message:    string;
  entityType: string | null;
  entityId:   number | null;
  url:        string | null;
  isRead:     boolean;
  createdAt:  string;
}