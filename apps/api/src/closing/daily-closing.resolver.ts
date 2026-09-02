import {
  UseGuards
} from "@nestjs/common";
import {
  Args,
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
import { DailyClosingInput } from "./dto/daily-closing.input";
import { DailyClosingReportModel } from "./daily-closing.model";
import { DailyClosingService } from "./daily-closing.service";

@Resolver()
export class DailyClosingResolver {
  constructor(
    private readonly dailyClosingService: DailyClosingService,
    private readonly stores: StoresService
  ) {}

  @Query(
    () => DailyClosingReportModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async dailyClosingReport(
    @Args("input")
    input: DailyClosingInput,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      input.storeId
    );

    return this.dailyClosingService.dailyClosing(
      input,
      user.businessId
    );
  }
}
