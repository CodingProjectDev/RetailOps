import {
  BadRequestException,
  ConflictException,
  Injectable
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { UserRole } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeInput } from "./dto/create-employee.input";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  employees(
    businessId: string
  ) {
    return this.prisma.user.findMany({
      where: {
        businessId,
        role: {
          in: [
            UserRole.CASHIER,
            UserRole.INVENTORY_CLERK
          ]
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async createEmployee(
    businessId: string,
    input: CreateEmployeeInput
  ) {
    const name =
      input.name.trim();

    const email =
      input.email
        .trim()
        .toLowerCase();

    if (name.length < 2) {
      throw new BadRequestException(
        "Name is too short"
      );
    }

    if (!email.includes("@")) {
      throw new BadRequestException(
        "Enter a valid email"
      );
    }

    if (input.password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters"
      );
    }

    const business =
      await this.prisma.business.findFirst({
        where: {
          id: businessId,
          active: true
        },
        select: {
          id: true
        }
      });

    if (!business) {
      throw new BadRequestException(
        "Business account is inactive"
      );
    }

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email
        }
      });

    if (existing) {
      throw new ConflictException(
        "An account with that email already exists"
      );
    }

    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash:
          await hash(
            input.password,
            12
          ),
        role:
          UserRole.CASHIER,
        active: true,
        businessId
      }
    });
  }
}
