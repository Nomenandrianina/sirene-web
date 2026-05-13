export const ROLES = {
    SUPERADMIN:        'SUPERADMIN',
    BNGRC_ALERTE:      'BNGRC_ALERTE',
    CUSTOMER_ADMIN:    'CUSTOMER_ADMIN',
    CUSTOMER_OPERATOR: 'CUSTOMER_OPERATOR',
  } as const;
  
  export type RoleName = typeof ROLES[keyof typeof ROLES];
  
  // Rôles auto-validés
  export const AUTO_APPROVED_ROLES = [
    ROLES.SUPERADMIN,
    ROLES.CUSTOMER_ADMIN,
  ];