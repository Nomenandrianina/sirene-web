import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface Props {
  permission?:  string;           // une seule permission
  any?:         string[];         // au moins une de ces permissions
  all?:         string[];         // toutes ces permissions
  fallback?:    ReactNode;        // rendu si pas autorisé (défaut: null)
  children:     ReactNode;
}

// Usage :
// <CanDo permission="users:create">
//   <button>Créer</button>
// </CanDo>
//
// <CanDo any={["roles:manage", "permissions:manage"]}>
//   <AdminPanel/>
// </CanDo>
//
// <CanDo permission="users:delete" fallback={<span title="Non autorisé">🔒</span>}>
//   <button onClick={handleDelete}>Supprimer</button>
// </CanDo>

export function CanDo({ permission, any: anyPerms, all: allPerms, fallback = null, children }: Props) {
  const { can, canAny, canAll } = useAuth();

  let allowed = true;
  if (permission)  allowed = can(permission);
  if (anyPerms)    allowed = canAny(...anyPerms);
  if (allPerms)    allowed = canAll(...allPerms);

  return allowed ? <>{children}</> : <>{fallback}</>;
}