import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";

function readCookie(
  cookieHeader: string | undefined,
  name: string
) {
  if (!cookieHeader) {
    return undefined;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) =>
      part.startsWith(`${name}=`)
    );

  return match
    ? decodeURIComponent(
        match.slice(name.length + 1)
      )
    : undefined;
}

@Injectable()
export class GqlAuthGuard
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
      gql.getContext().req;

    const token =
      readCookie(
        req.headers?.cookie,
        "retailops_access_token"
      );

    if (!token) {
      throw new UnauthorizedException(
        "Please sign in"
      );
    }

    try {
      const payload =
        await this.jwt.verifyAsync<{
          sub: string;
          businessId?: string;
        }>(token);

      const user =
        await this.prisma.user.findUnique({
          where: {
            id: payload.sub
          },
          include: {
            business: true
          }
        });

      if (
        !user ||
        !user.active ||
        !user.businessId ||
        !user.business ||
        !user.business.active
      ) {
        throw new UnauthorizedException(
          "Account or business is inactive"
        );
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        businessId: user.businessId,
        createdAt: user.createdAt
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        "Session expired. Please sign in again."
      );
    }
  }
}
