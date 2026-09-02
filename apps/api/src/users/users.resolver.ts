import {
  UseGuards
} from "@nestjs/common";
import {
  Args,
  Mutation,
  Query,
  Resolver
} from "@nestjs/graphql";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { GqlAuthGuard } from "../auth/guards/gql-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../generated/prisma/enums";
import { CreateEmployeeInput } from "./dto/create-employee.input";
import { UserModel } from "./user.model";
import { UsersService } from "./users.service";

type TenantUser = {
  id: string;
  businessId: string;
};

@Resolver(() => UserModel)
@UseGuards(
  GqlAuthGuard,
  RolesGuard
)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER
)
export class UsersResolver {
  constructor(
    private readonly users: UsersService
  ) {}

  @Query(() => [UserModel])
  employees(
    @CurrentUser()
    user: TenantUser
  ) {
    return this.users.employees(
      user.businessId
    );
  }

  @Mutation(() => UserModel)
  createEmployee(
    @Args("input")
    input: CreateEmployeeInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.users.createEmployee(
      user.businessId,
      input
    );
  }
}
