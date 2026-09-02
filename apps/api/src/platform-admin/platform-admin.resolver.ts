
import {
  UseGuards
} from "@nestjs/common";
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver
} from "@nestjs/graphql";
import {
  UserRole
} from "../generated/prisma/enums";
import {
  CurrentPlatformAdmin
} from "./decorators/current-platform-admin.decorator";
import {
  PlatformAdminLoginInput
} from "./dto/platform-admin-login.input";
import {
  CreatePlatformBusinessOwnerInput
} from "./dto/create-platform-business-owner.input";
import {
  PlatformAdminGuard
} from "./guards/platform-admin.guard";
import {
  PlatformAdminDashboardModel,
  PlatformAdminModel,
  PlatformAuditLogModel,
  PlatformBusinessModel,
  PlatformUserModel
} from "./platform-admin.model";
import {
  PlatformAdminService
} from "./platform-admin.service";

@Resolver()
export class PlatformAdminResolver {
  constructor(
    private readonly service: PlatformAdminService
  ) {}

  private setAdminCookie(
    context: any,
    token: string
  ) {
    context.res.clearCookie(
      "retailops_access_token",
      {
        path: "/"
      }
    );

    context.res.cookie(
      "retailops_platform_admin_token",
      token,
      {
        httpOnly: true,
        sameSite:
          "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        maxAge:
          8 *
          60 *
          60 *
          1000,
        path:
          "/"
      }
    );
  }

  @Mutation(
    () =>
      PlatformAdminModel
  )
  async platformAdminLogin(
    @Args("input")
    input: PlatformAdminLoginInput,

    @Context()
    context: any
  ) {
    const {
      admin,
      token
    } =
      await this.service.login(
        input
      );

    this.setAdminCookie(
      context,
      token
    );

    return admin;
  }

  @Mutation(
    () => Boolean
  )
  platformAdminLogout(
    @Context()
    context: any
  ) {
    context.res.clearCookie(
      "retailops_platform_admin_token",
      {
        path: "/"
      }
    );

    return true;
  }

  @Query(
    () =>
      PlatformAdminModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformAdminMe(
    @CurrentPlatformAdmin()
    admin: PlatformAdminModel
  ) {
    return admin;
  }

  @Query(
    () =>
      PlatformAdminDashboardModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformAdminDashboard() {
    return this.service.dashboard();
  }


  @Mutation(
    () =>
      PlatformBusinessModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformCreateBusinessOwner(
    @Args("input")
    input: CreatePlatformBusinessOwnerInput,

    @CurrentPlatformAdmin()
    admin: PlatformAdminModel
  ) {
    return this.service.createBusinessOwner(
      admin,
      input
    );
  }



  @Query(
    () => [
      PlatformBusinessModel
    ]
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformBusinesses(
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
    return this.service.businesses(
      search,
      active
    );
  }

  @Query(
    () => [
      PlatformUserModel
    ]
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformUsers(
    @Args("search", {
      type: () => String,
      nullable: true
    })
    search?: string,

    @Args("role", {
      type: () => UserRole,
      nullable: true
    })
    role?: UserRole,

    @Args("active", {
      type: () => Boolean,
      nullable: true
    })
    active?: boolean,

    @Args("businessId", {
      type: () => String,
      nullable: true
    })
    businessId?: string
  ) {
    return this.service.users(
      search,
      role,
      active,
      businessId
    );
  }


  @Mutation(
    () =>
      PlatformUserModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformResetBusinessOwnerPassword(
    @Args("businessId")
    businessId: string,

    @Args("newTemporaryPassword")
    newTemporaryPassword: string,

    @CurrentPlatformAdmin()
    admin: PlatformAdminModel
  ) {
    return this.service.resetBusinessOwnerPassword(
      admin,
      businessId,
      newTemporaryPassword
    );
  }

  @Mutation(
    () =>
      PlatformBusinessModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformSetBusinessActive(
    @Args("businessId")
    businessId: string,

    @Args("active")
    active: boolean,

    @CurrentPlatformAdmin()
    admin: PlatformAdminModel,

    @Args("reason", {
      type: () => String,
      nullable: true
    })
    reason?: string
  ) {
    return this.service.setBusinessActive(
      admin,
      businessId,
      active,
      reason
    );
  }

  @Mutation(
    () =>
      PlatformUserModel
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformSetUserActive(
    @Args("userId")
    userId: string,

    @Args("active")
    active: boolean,

    @CurrentPlatformAdmin()
    admin: PlatformAdminModel,

    @Args("reason", {
      type: () => String,
      nullable: true
    })
    reason?: string
  ) {
    return this.service.setUserActive(
      admin,
      userId,
      active,
      reason
    );
  }

  @Query(
    () => [
      PlatformAuditLogModel
    ]
  )
  @UseGuards(
    PlatformAdminGuard
  )
  platformAuditLogs() {
    return this.service.auditLogs();
  }
}
