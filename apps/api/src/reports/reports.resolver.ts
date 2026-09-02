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
import { ReportFilterInput } from "./dto/report-filter.input";
import { SalesReportModel } from "./report.model";
import { ReportsService } from "./reports.service";

@Resolver()
export class ReportsResolver {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly stores: StoresService
  ) {}

  @Query(
    () => SalesReportModel
  )
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER
  )
  async salesReport(
    @Args("filter")
    filter: ReportFilterInput,

    @CurrentUser()
    user: TenantUser
  ) {
    await this.stores.assertStoreAccess(
      user,
      filter.storeId
    );

    return this.reportsService.salesReport(
      filter,
      user.businessId
    );
  }
}
