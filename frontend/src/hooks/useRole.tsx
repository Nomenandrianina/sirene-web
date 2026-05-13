import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles.constants'; // ← même constantes côté front

export function useRole() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        isSuperAdmin:       false,
        isBngrc:            false,
        isCustomerAdmin:    false,
        isCustomerOperator: false,
        isClient:           false,
        isAutoApproved:     false,
        customerId:         null,
        userId:             null,
        role:               null,
      };
    }

    const roleName         = user.role?.name?.toUpperCase() ?? '';
    const isSuperAdmin     = roleName === ROLES.SUPERADMIN;
    const isBngrc          = roleName === ROLES.BNGRC_ALERTE;
    const isCustomerAdmin  = roleName === ROLES.CUSTOMER_ADMIN;
    const isCustomerOperator = roleName === ROLES.CUSTOMER_OPERATOR;

    // isClient = appartient à un customer (admin ou operator)
    const isClient         = isCustomerAdmin || isCustomerOperator;

    // Auto-validé = pas besoin de validation
    const isAutoApproved   = isSuperAdmin || isBngrc || isCustomerAdmin;

    return {
      isSuperAdmin,
      isBngrc,
      isCustomerAdmin,
      isCustomerOperator,
      isClient,
      isAutoApproved,
      customerId: user.customer?.id ?? null,
      userId:     user.id,
      role:       user.role,
    };
  }, [user]);
}