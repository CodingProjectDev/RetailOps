import {
  UseGuards
} from "@nestjs/common";
import {
  Args,
  Mutation,
  Query,
  Resolver,
  registerEnumType
} from "@nestjs/graphql";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { GqlAuthGuard } from "../auth/guards/gql-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { TenantUser } from "../auth/tenant-user.type";
import {
  PurchaseOrderStatus,
  UserRole
} from "../generated/prisma/enums";
import { CancelPurchaseOrderInput } from "./dto/cancel-purchase-order.input";
import { CreatePurchaseOrderInput } from "./dto/create-purchase-order.input";
import { CreateSupplierInput } from "./dto/create-supplier.input";
import { ReceivePurchaseOrderInput } from "./dto/receive-purchase-order.input";
import { UpdateSupplierInput } from "./dto/update-supplier.input";
import {
  PurchaseOrderModel,
  SupplierModel
} from "./purchasing.model";
import { PurchasingService } from "./purchasing.service";

registerEnumType(
  PurchaseOrderStatus,
  {
    name:
      "PurchaseOrderStatus"
  }
);

@Resolver()
export class PurchasingResolver {
  constructor(
    private readonly purchasing: PurchasingService
  ) {}

  @Query(() => [SupplierModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  suppliers(
    @CurrentUser()
    user: TenantUser,

    @Args("search", {
      type: () => String,
      nullable: true
    })
    search?: string,

    @Args("active", {
      type: () => Boolean,
      nullable: true
    })
    active?: boolean
  ) {
    return this.purchasing.suppliers(
      user.businessId,
      search,
      active
    );
  }

  @Mutation(() => SupplierModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  createSupplier(
    @Args("input")
    input: CreateSupplierInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.createSupplier(
      input,
      user.businessId
    );
  }

  @Mutation(() => SupplierModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  updateSupplier(
    @Args("input")
    input: UpdateSupplierInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.updateSupplier(
      input,
      user.businessId
    );
  }

  @Query(
    () => [PurchaseOrderModel]
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  purchaseOrders(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @CurrentUser()
    user: TenantUser,

    @Args("search", {
      type: () => String,
      nullable: true
    })
    search?: string,

    @Args("status", {
      type:
        () => PurchaseOrderStatus,
      nullable: true
    })
    status?: PurchaseOrderStatus
  ) {
    return this.purchasing.purchaseOrders(
      user,
      storeId,
      search,
      status
    );
  }

  @Mutation(
    () => PurchaseOrderModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  createPurchaseOrder(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @Args("input")
    input: CreatePurchaseOrderInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.createPurchaseOrder(
      input,
      user,
      storeId
    );
  }

  @Mutation(
    () => PurchaseOrderModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  placePurchaseOrder(
    @Args("purchaseOrderId", {
      type: () => String
    })
    purchaseOrderId: string,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.placePurchaseOrder(
      purchaseOrderId,
      user
    );
  }

  @Mutation(
    () => PurchaseOrderModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  cancelPurchaseOrder(
    @Args("input")
    input: CancelPurchaseOrderInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.cancelPurchaseOrder(
      input,
      user
    );
  }

  @Mutation(
    () => PurchaseOrderModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  receivePurchaseOrder(
    @Args("input")
    input: ReceivePurchaseOrderInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.purchasing.receivePurchaseOrder(
      input,
      user
    );
  }
}
