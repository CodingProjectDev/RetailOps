import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { UserRole } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { TenantUser } from "../auth/tenant-user.type";
import { AssignUserStoresInput } from "./dto/assign-user-stores.input";
import { CreateStoreInput } from "./dto/create-store.input";
import { CreateStoreStaffInput } from "./dto/create-store-staff.input";
import { UpdateStoreInput } from "./dto/update-store.input";

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  private normalizeCode(value: string) {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20);
  }

  private storeModel(store: any) {
    return {
      id: store.id,
      name: store.name,
      code: store.code,
      address: store.address,
      phone: store.phone,
      active: store.active,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };
  }

  private staffModel(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      stores: (user.storeAssignments ?? []).map(
        (assignment: any) =>
          this.storeModel(
            assignment.store
          )
      )
    };
  }

  async storesForUser(
    user: TenantUser
  ) {
    if (user.role === UserRole.OWNER) {
      return this.prisma.store.findMany({
        where: {
          businessId:
            user.businessId
        },
        orderBy: [
          {
            active: "desc"
          },
          {
            name: "asc"
          }
        ]
      });
    }

    return this.prisma.store.findMany({
      where: {
        businessId:
          user.businessId,
        userAccess: {
          some: {
            userId: user.id
          }
        }
      },
      orderBy: [
        {
          active: "desc"
        },
        {
          name: "asc"
        }
      ]
    });
  }

  async staffForUser(
    user: TenantUser
  ) {
    if (user.role === UserRole.OWNER) {
      const rows =
        await this.prisma.user.findMany({
          where: {
            businessId:
              user.businessId
          },
          include: {
            storeAssignments: {
              include: {
                store: true
              }
            }
          },
          orderBy: [
            {
              role: "asc"
            },
            {
              name: "asc"
            }
          ]
        });

      return rows.map(
        (row) =>
          this.staffModel(row)
      );
    }

    const managerStoreIds =
      (
        await this.prisma.userStore.findMany({
          where: {
            userId: user.id,
            store: {
              businessId:
                user.businessId
            }
          },
          select: {
            storeId: true
          }
        })
      ).map(
        (row) =>
          row.storeId
      );

    if (!managerStoreIds.length) {
      return [];
    }

    const rows =
      await this.prisma.user.findMany({
        where: {
          businessId:
            user.businessId,
          OR: [
            {
              id: user.id
            },
            {
              storeAssignments: {
                some: {
                  storeId: {
                    in:
                      managerStoreIds
                  }
                }
              }
            }
          ]
        },
        include: {
          storeAssignments: {
            where: {
              storeId: {
                in:
                  managerStoreIds
              }
            },
            include: {
              store: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      });

    return rows.map(
      (row) =>
        this.staffModel(row)
    );
  }

  async createStore(
    input: CreateStoreInput,
    businessId: string
  ) {
    const name =
      input.name.trim();

    const code =
      this.normalizeCode(
        input.code
      );

    if (name.length < 2) {
      throw new BadRequestException(
        "Store name must be at least 2 characters"
      );
    }

    if (!code) {
      throw new BadRequestException(
        "Store code is required"
      );
    }

    const duplicateCode =
      await this.prisma.store.findFirst({
        where: {
          businessId,
          code
        }
      });

    if (duplicateCode) {
      throw new ConflictException(
        "That store code already exists in this business"
      );
    }

    const duplicateName =
      await this.prisma.store.findFirst({
        where: {
          businessId,
          name: {
            equals: name,
            mode: "insensitive"
          }
        }
      });

    if (duplicateName) {
      throw new ConflictException(
        "A store with that name already exists in this business"
      );
    }

    return this.prisma.store.create({
      data: {
        businessId,
        name,
        code,
        address:
          input.address
            ?.trim() ||
          null,
        phone:
          input.phone
            ?.trim() ||
          null,
        active: true
      }
    });
  }

  async updateStore(
    input: UpdateStoreInput,
    businessId: string
  ) {
    const current =
      await this.prisma.store.findFirst({
        where: {
          id: input.id,
          businessId
        }
      });

    if (!current) {
      throw new NotFoundException(
        "Store not found"
      );
    }

    const name =
      input.name !== undefined
        ? input.name.trim()
        : current.name;

    const code =
      input.code !== undefined
        ? this.normalizeCode(
            input.code
          )
        : current.code;

    if (name.length < 2) {
      throw new BadRequestException(
        "Store name must be at least 2 characters"
      );
    }

    if (!code) {
      throw new BadRequestException(
        "Store code is required"
      );
    }

    const duplicate =
      await this.prisma.store.findFirst({
        where: {
          businessId,
          id: {
            not:
              current.id
          },
          OR: [
            {
              code
            },
            {
              name: {
                equals: name,
                mode: "insensitive"
              }
            }
          ]
        }
      });

    if (duplicate) {
      throw new ConflictException(
        "Another store already uses this name or code"
      );
    }

    return this.prisma.store.update({
      where: {
        id: current.id
      },
      data: {
        ...(input.name !==
        undefined
          ? {
              name
            }
          : {}),
        ...(input.code !==
        undefined
          ? {
              code
            }
          : {}),
        ...(input.address !==
        undefined
          ? {
              address:
                input.address
                  .trim() ||
                null
            }
          : {}),
        ...(input.phone !==
        undefined
          ? {
              phone:
                input.phone
                  .trim() ||
                null
            }
          : {}),
        ...(input.active !==
        undefined
          ? {
              active:
                input.active
            }
          : {})
      }
    });
  }

  private async validateStores(
    businessId: string,
    storeIds: string[]
  ) {
    const uniqueStoreIds =
      Array.from(
        new Set(
          storeIds.filter(
            Boolean
          )
        )
      );

    if (!uniqueStoreIds.length) {
      throw new BadRequestException(
        "Assign at least one store"
      );
    }

    const stores =
      await this.prisma.store.findMany({
        where: {
          businessId,
          id: {
            in:
              uniqueStoreIds
          },
          active: true
        },
        select: {
          id: true
        }
      });

    if (
      stores.length !==
      uniqueStoreIds.length
    ) {
      throw new BadRequestException(
        "One or more selected stores are invalid, inactive, or belong to another business"
      );
    }

    return uniqueStoreIds;
  }

  async createStaff(
    input: CreateStoreStaffInput,
    businessId: string
  ) {
    const allowedStaffRoles: UserRole[] = [
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.INVENTORY_CLERK
    ];

    if (
      !allowedStaffRoles.includes(
        input.role
      )
    ) {
      throw new BadRequestException(
        "Staff role must be Manager, Cashier, or Inventory Clerk"
      );
    }

    const name =
      input.name.trim();

    const email =
      input.email
        .trim()
        .toLowerCase();

    if (name.length < 2) {
      throw new BadRequestException(
        "Name must be at least 2 characters"
      );
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        email
      )
    ) {
      throw new BadRequestException(
        "Enter a valid email address"
      );
    }

    if (
      input.password.length < 8
    ) {
      throw new BadRequestException(
        "Password must be at least 8 characters"
      );
    }

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email
        },
        select: {
          id: true
        }
      });

    if (existing) {
      throw new ConflictException(
        "An account with this email already exists"
      );
    }

    const storeIds =
      await this.validateStores(
        businessId,
        input.storeIds
      );

    const created =
      await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash:
            await hash(
              input.password,
              12
            ),
          role:
            input.role,
          active: true,
          businessId,
          storeAssignments: {
            create:
              storeIds.map(
                (storeId) => ({
                  storeId
                })
              )
          }
        },
        include: {
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    return this.staffModel(
      created
    );
  }

  async assignUserStores(
    input: AssignUserStoresInput,
    businessId: string
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id:
            input.userId,
          businessId
        },
        include: {
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    if (!target) {
      throw new NotFoundException(
        "Staff account not found"
      );
    }

    if (
      target.role ===
      UserRole.OWNER
    ) {
      throw new BadRequestException(
        "Business owners automatically have access to every store"
      );
    }

    const storeIds =
      await this.validateStores(
        businessId,
        input.storeIds
      );

    await this.prisma.$transaction(
      async (tx) => {
        await tx.userStore.deleteMany({
          where: {
            userId:
              target.id
          }
        });

        await tx.userStore.createMany({
          data:
            storeIds.map(
              (storeId) => ({
                userId:
                  target.id,
                storeId
              })
            )
        });
      }
    );

    const updated =
      await this.prisma.user.findFirst({
        where: {
          id:
            target.id,
          businessId
        },
        include: {
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    if (!updated) {
      throw new NotFoundException(
        "Staff account could not be reloaded"
      );
    }

    return this.staffModel(
      updated
    );
  }

  async assertStoreAccess(
    user: TenantUser,
    storeId: string
  ) {
    const store =
      await this.prisma.store.findFirst({
        where: {
          id: storeId,
          businessId:
            user.businessId,
          active: true
        }
      });

    if (!store) {
      throw new NotFoundException(
        "Store not found"
      );
    }

    if (
      user.role ===
      UserRole.OWNER
    ) {
      return store;
    }

    const assignment =
      await this.prisma.userStore.findUnique({
        where: {
          userId_storeId: {
            userId:
              user.id,
            storeId:
              store.id
          }
        }
      });

    if (!assignment) {
      throw new ForbiddenException(
        "You do not have access to this store"
      );
    }

    return store;
  }
}
