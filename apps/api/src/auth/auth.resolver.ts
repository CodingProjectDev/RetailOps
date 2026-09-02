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
import { UserModel } from "../users/user.model";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginInput } from "./dto/login.input";
import { RegisterBusinessInput } from "./dto/register-business.input";
import { GqlAuthGuard } from "./guards/gql-auth.guard";

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService
  ) {}

  private setAccessCookie(
    context: any,
    token: string
  ) {
    context.res.clearCookie(
      "retailops_platform_admin_token",
      {
        path: "/"
      }
    );

    context.res.cookie(
      "retailops_access_token",
      token,
      {
        httpOnly: true,
sameSite:
  process.env.NODE_ENV === "production"
    ? "none"
    : "lax",
secure:
  process.env.NODE_ENV === "production",
        maxAge:
          8 * 60 * 60 * 1000,
        path: "/"
      }
    );
  }

  @Mutation(() => UserModel)
  async login(
    @Args("input")
    input: LoginInput,

    @Context()
    context: any
  ) {
    const {
      user,
      token
    } = await this.auth.login(input);

    this.setAccessCookie(
      context,
      token
    );

    return user;
  }

  @Mutation(() => UserModel)
  async registerBusiness(
    @Args("input")
    input: RegisterBusinessInput,

    @Context()
    context: any
  ) {
    const {
      user,
      token
    } =
      await this.auth.registerBusiness(
        input
      );

    this.setAccessCookie(
      context,
      token
    );

    return user;
  }

  @Mutation(() => Boolean)
  logout(
    @Context()
    context: any
  ) {
    context.res.clearCookie(
      "retailops_access_token",
      {
        path: "/"
      }
    );

    return true;
  }

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  me(
    @CurrentUser()
    user: UserModel
  ) {
    return user;
  }
}
