import { Customer } from "./customer";
import { Role } from "./role";

export interface User {
    id: number;
    last_name: string | null;
    first_name: string | null;
    email: string;
    role_id: number | null;
    is_active: boolean;
    created_at: string;
    customers_id: number | null;
    role?: Role;
    customer?: Customer;
}
  