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
import { BusinessModel } from "./business.model";
import { BusinessesService } from "./businesses.service";
import { UpdateBusinessInput } from "./dto/update-business.input";

type TenantUser = {
  id: string;
  businessId: string;
  role: UserRole;
};

@Resolver(() => BusinessModel)
export class BusinessesResolver {
  constructor(
    private readonly businesses: BusinessesService
  ) {}

  @Query(() => BusinessModel)
  @UseGuards(GqlAuthGuard)
  myBusiness(
    @CurrentUser()
    user: TenantUser
  ) {
    return this.businesses.myBusiness(
      user.businessId
    );
  }

  @Mutation(() => BusinessModel)
  @UseGuards(
    GqlAuthGuard,
    RolesGuard
  )
  @Roles(UserRole.OWNER)
  updateMyBusiness(
    @Args("input")
    input: UpdateBusinessInput,

    @CurrentUser()
    user: TenantUser
  ) {
    return this.businesses.updateMyBusiness(
      user.businessId,
      input
    );
  }
}
