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
import { AdjustInventoryInput } from "./dto/adjust-inventory.input";
import { CreateProductInput } from "./dto/create-product.input";
import { UpdateProductInput } from "./dto/update-product.input";
import {
  CategoryModel,
  InventoryMovementModel,
  ProductModel
} from "./product.model";
import { ProductsService } from "./products.service";

@Resolver(() => ProductModel)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stores: StoresService
  ) {}

  @Query(() => ProductModel, {
    nullable: true
  })
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
  async productByBarcode(
    @Args("barcode", {
      type: () => String
    })
    barcode: string,

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

    return this.productsService.byBarcode(
      barcode.trim(),
      user.businessId,
      storeId
    );
  }

  @Query(() => [ProductModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  async inventory(
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
    search?: string
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.productsService.inventory(
      user.businessId,
      storeId,
      search
    );
  }

  @Query(() => [ProductModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  async products(
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

    @Args("categoryId", {
      type: () => String,
      nullable: true
    })
    categoryId?: string,

    @Args("active", {
      type: () => Boolean,
      nullable: true
    })
    active?: boolean
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.productsService.managerProducts(
      user.businessId,
      storeId,
      search,
      categoryId,
      active
    );
  }

  @Query(() => [CategoryModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.INVENTORY_CLERK
  )
  categories(
    @CurrentUser()
    user: TenantUser
  ) {
    return this.productsService.categories(
      user.businessId
    );
  }

  @Query(
    () => [InventoryMovementModel]
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
  async inventoryMovements(
    @Args("productId", {
      type: () => String
    })
    productId: string,

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

    return this.productsService.inventoryMovements(
      productId,
      user.businessId,
      storeId
    );
  }

  @Mutation(() => ProductModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async createProduct(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @Args("input")
    input: CreateProductInput,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.productsService.create(
      input,
      user.id,
      user.businessId,
      storeId
    );
  }

  @Mutation(() => ProductModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async updateProduct(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @Args("input")
    input: UpdateProductInput,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.productsService.update(
      input,
      user.businessId,
      storeId
    );
  }

  @Mutation(
    () => InventoryMovementModel
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
  async adjustInventory(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @Args("input")
    input: AdjustInventoryInput,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    return this.productsService.adjustInventory(
      input,
      user.id,
      user.businessId,
      storeId
    );
  }
}
