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
import { StoresService } from "../stores/stores.service";
import { CompleteSaleInput } from "./dto/complete-sale.input";
import { RefundSaleInput } from "./dto/refund-sale.input";
import { SalesFilterInput } from "./dto/sales-filter.input";
import { VoidSaleInput } from "./dto/void-sale.input";
import {
  SaleHistoryModel,
  SaleModel,
  SalesCashierModel
} from "./sale.model";
import { SalesService } from "./sales.service";

@Resolver(() => SaleModel)
export class SalesResolver {
  constructor(
    private readonly salesService: SalesService,
    private readonly stores: StoresService
  ) {}

  @Mutation(() => SaleModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.CASHIER
  )
  completeSale(
    @Args("input")
    input: CompleteSaleInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.salesService.completeSale(
      input,
      user
    );
  }

  @Mutation(
    () => SaleHistoryModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  voidSale(
    @Args("input")
    input: VoidSaleInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.salesService.voidSale(
      input,
      user
    );
  }

  @Mutation(
    () => SaleHistoryModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  refundSale(
    @Args("input")
    input: RefundSaleInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.salesService.refundSale(
      input,
      user
    );
  }

  @Query(
    () => [SaleHistoryModel]
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async sales(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @CurrentUser()
    user: TenantUser,

    @Args("filter", {
      nullable: true
    })
    filter?: SalesFilterInput
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.salesService.history(
      filter,
      user.businessId,
      storeId
    );
  }

  @Query(
    () => [SalesCashierModel]
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async salesCashiers(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.salesService.cashiers(
      user.businessId,
      storeId
    );
  }
}
