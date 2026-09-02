import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../generated/prisma/enums";

export const ROLES_KEY = "retailops_roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
