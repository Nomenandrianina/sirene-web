// ─────────────────────────────────────────────
//  services/index.ts
//  Point d'entrée unique pour tous les services
//
//  Usage dans les composants :
//    import { usersApi, rolesApi } from '@/services'
// ─────────────────────────────────────────────

export { authApi }                            from './auth.api';
export { usersApi }                           from './users.api';
export { rolesApi }                           from './roles.api';
export { permissionsApi }                     from './permissions.api';
export { customersApi }                       from './customers.api';

// Re-export des types DTO si besoin dans les pages
export type { CreateUserDto, UpdateUserDto, UpdateProfileDto, ChangePasswordDto } from './users.api';
export type { CreateRoleDto, UpdateRoleDto }                                      from './roles.api';
export type { CreatePermissionDto, UpdatePermissionDto }                          from './permissions.api';
export type { CreateCustomerDto, UpdateCustomerDto }                              from './customers.api';
