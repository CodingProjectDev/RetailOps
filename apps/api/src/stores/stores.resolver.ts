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
import { TenantUser } from "../auth/tenant-user.type";
import { UserRole } from "../generated/prisma/enums";
import { AssignUserStoresInput } from "./dto/assign-user-stores.input";
import { CreateStoreInput } from "./dto/create-store.input";
import { CreateStoreStaffInput } from "./dto/create-store-staff.input";
import { UpdateStoreInput } from "./dto/update-store.input";
import {
  StoreModel,
  StoreStaffModel
} from "./store.model";
import { StoresService } from "./stores.service";

@Resolver()
export class StoresResolver {
  constructor(
    private readonly stores: StoresService
  ) {}

  @Query(() => [StoreModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.INVENTORY_CLERK
  )
  myStores(
    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.storesForUser(
      user
    );
  }

  @Query(
    () => [StoreStaffModel]
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  storeStaff(
    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.staffForUser(
      user
    );
  }

  @Mutation(() => StoreModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(UserRole.OWNER)
  createStore(
    @Args("input")
    input: CreateStoreInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.createStore(
      input,
      user.businessId
    );
  }

  @Mutation(() => StoreModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(UserRole.OWNER)
  updateStore(
    @Args("input")
    input: UpdateStoreInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.updateStore(
      input,
      user.businessId
    );
  }

  @Mutation(
    () => StoreStaffModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(UserRole.OWNER)
  createStoreStaff(
    @Args("input")
    input: CreateStoreStaffInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.createStaff(
      input,
      user.businessId
    );
  }

  @Mutation(
    () => StoreStaffModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(UserRole.OWNER)
  assignUserStores(
    @Args("input")
    input: AssignUserStoresInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.stores.assignUserStores(
      input,
      user.businessId
    );
  }
}
