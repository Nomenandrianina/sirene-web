import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // adaptez le chemin

/**
 * Hook utilitaire pour la détection du rôle et du contexte customer.
 *
 * Logique :
 * - isSuperAdmin : role.name contient "superadmin" (insensible à la casse)
 * - isClient     : user.customer !== null (un customer est associé)
 * - customerId   : l'id du customer lié à l'user connecté
 */
export function useRole() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return { isSuperAdmin: false, isClient: false, customerId: null, userId: null };
    }

    const roleName     = user.role?.name?.toLowerCase() ?? '';
    const isSuperAdmin = roleName.includes('superadmin');
    const isClient     = !!user.customer;
    const customerId   = user.customer?.id ?? null;
    const userId       = user.id;

    return { isSuperAdmin, isClient, customerId, userId };
  }, [user]);
}