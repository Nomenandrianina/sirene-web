import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "required_permission";

// Usage: @RequirePermission("users:create")
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);