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
import { CloseShiftInput } from "./dto/close-shift.input";
import { ForceCloseShiftInput } from "./dto/force-close-shift.input";
import { StartShiftInput } from "./dto/start-shift.input";
import { ShiftModel } from "./shift.model";
import { ShiftsService } from "./shifts.service";

@Resolver(() => ShiftModel)
export class ShiftsResolver {
  constructor(
    private readonly shiftsService: ShiftsService
  ) {}

  @Query(() => ShiftModel, {
    nullable: true
  })
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.CASHIER
  )
  currentShift(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.shiftsService.currentShift(
      user,
      storeId
    );
  }

  @Mutation(() => ShiftModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.CASHIER
  )
  startShift(
    @Args("input")
    input: StartShiftInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.shiftsService.startShift(
      input,
      user
    );
  }

  @Mutation(() => ShiftModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.CASHIER
  )
  closeShift(
    @Args("input")
    input: CloseShiftInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.shiftsService.closeShift(
      input,
      user
    );
  }

  @Query(() => [ShiftModel])
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  shifts(
    @Args("storeId", {
      type: () => String
    })
    storeId: string,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.shiftsService.history(
      user,
      storeId
    );
  }

  @Mutation(() => ShiftModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  forceCloseShift(
    @Args("input")
    input: ForceCloseShiftInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.shiftsService.forceCloseShift(
      input,
      user
    );
  }
}
