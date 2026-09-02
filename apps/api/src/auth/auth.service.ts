import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  compare,
  hash
} from "bcryptjs";
import { randomBytes } from "crypto";
import { UserRole } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { LoginInput } from "./dto/login.input";
import { RegisterBusinessInput } from "./dto/register-business.input";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private async issueToken(user: {
    id: string;
    email: string;
    role: UserRole;
    businessId: string;
  }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    });
  }

  private slugBase(value: string) {
    const cleaned = value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);

    return cleaned || "business";
  }

  private async uniqueBusinessSlug(name: string) {
    const base = this.slugBase(name);

    const first = await this.prisma.business.findUnique({
      where: { slug: base },
      select: { id: true }
    });

    if (!first) {
      return base;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const suffix = randomBytes(3).toString("hex");
      const candidate = `${base}-${suffix}`;

      const exists = await this.prisma.business.findUnique({
        where: { slug: candidate },
        select: { id: true }
      });

      if (!exists) {
        return candidate;
      }
    }

    throw new BadRequestException(
      "Unable to generate a unique business identifier. Please try again."
    );
  }

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        business: true
      }
    });

    if (
      !user ||
      !user.active ||
      !user.business ||
      !user.business.active
    ) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    const validPassword = await compare(
      input.password,
      user.passwordHash
    );

    if (!validPassword) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    const token = await this.issueToken({
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    });

    return {
      user,
      token
    };
  }

  async registerBusiness(
    input: RegisterBusinessInput
  ) {
    const businessName = input.businessName.trim();
    const ownerName = input.ownerName.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (businessName.length < 2) {
      throw new BadRequestException(
        "Business name must be at least 2 characters"
      );
    }

    if (ownerName.length < 2) {
      throw new BadRequestException(
        "Owner name must be at least 2 characters"
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException(
        "Enter a valid email address"
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters"
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictException(
        "An account with this email already exists"
      );
    }

    const slug = await this.uniqueBusinessSlug(
      businessName
    );

    const passwordHash = await hash(
      password,
      12
    );

    const user = await this.prisma.$transaction(
      async (tx) => {
        const business = await tx.business.create({
          data: {
            name: businessName,
            slug,
            active: true
          }
        });

        const owner = await tx.user.create({
          data: {
            name: ownerName,
            email,
            passwordHash,
            role: UserRole.OWNER,
            active: true,
            businessId: business.id
          }
        });

        const mainStore = await tx.store.create({
          data: {
            businessId: business.id,
            name: "Main Store",
            code: "MAIN",
            active: true
          }
        });

        await tx.userStore.create({
          data: {
            userId: owner.id,
            storeId: mainStore.id
          }
        });

        await tx.category.createMany({
          data: [
            {
              businessId: business.id,
              name: "Drinks"
            },
            {
              businessId: business.id,
              name: "Snacks"
            },
            {
              businessId: business.id,
              name: "Other"
            }
          ],
          skipDuplicates: true
        });

        return owner;
      }
    );

    const token = await this.issueToken({
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    });

    return {
      user,
      token
    };
  }
}
