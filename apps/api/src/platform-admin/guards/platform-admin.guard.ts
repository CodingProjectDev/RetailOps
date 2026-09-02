
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import {
  GqlExecutionContext
} from "@nestjs/graphql";
import {
  JwtService
} from "@nestjs/jwt";
import {
  PrismaService
} from "../../prisma/prisma.service";

function readCookie(
  cookieHeader:
    | string
    | undefined,
  name: string
) {
  if (!cookieHeader) {
    return undefined;
  }

  const match =
    cookieHeader
      .split(";")
      .map(
        (part) =>
          part.trim()
      )
      .find(
        (part) =>
          part.startsWith(
            `${name}=`
          )
      );

  return match
    ? decodeURIComponent(
        match.slice(
          name.length +
            1
        )
      )
    : undefined;
}

@Injectable()
export class PlatformAdminGuard
  implements CanActivate
{
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(
    context: ExecutionContext
  ) {
    const gql =
      GqlExecutionContext.create(
        context
      );

    const req =
      gql
        .getContext()
        .req;

    const token =
      readCookie(
        req.headers?.cookie,
        "retailops_platform_admin_token"
      );

    if (!token) {
      throw new UnauthorizedException(
        "Platform administrator sign-in required"
      );
    }

    try {
      const payload =
        await this.jwt.verifyAsync<{
          sub: string;
          scope: string;
        }>(token);

      if (
        payload.scope !==
        "PLATFORM_ADMIN"
      ) {
        throw new UnauthorizedException(
          "Invalid platform administrator session"
        );
      }

      const admin =
        await this.prisma.platformAdmin.findUnique({
          where: {
            id:
              payload.sub
          }
        });

      if (
        !admin ||
        !admin.active
      ) {
        throw new UnauthorizedException(
          "Platform administrator account is inactive"
        );
      }

      req.platformAdmin =
        admin;

      return true;
    } catch {
      throw new UnauthorizedException(
        "Platform administrator session expired"
      );
    }
  }
}
