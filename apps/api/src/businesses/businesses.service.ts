import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateBusinessInput } from "./dto/update-business.input";

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async myBusiness(businessId: string) {
    const business =
      await this.prisma.business.findFirst({
        where: {
          id: businessId,
          active: true
        }
      });

    if (!business) {
      throw new NotFoundException(
        "Business account not found"
      );
    }

    return business;
  }

  async updateMyBusiness(
    businessId: string,
    input: UpdateBusinessInput
  ) {
    const name = input.name.trim();

    if (name.length < 2) {
      throw new BadRequestException(
        "Business name is too short"
      );
    }

    const existing =
      await this.prisma.business.findFirst({
        where: {
          id: businessId,
          active: true
        },
        select: {
          id: true
        }
      });

    if (!existing) {
      throw new NotFoundException(
        "Business account not found"
      );
    }

    return this.prisma.business.update({
      where: {
        id: businessId
      },
      data: {
        name
      }
    });
  }
}
