import { UserRole } from "../generated/prisma/enums";

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string;
};
