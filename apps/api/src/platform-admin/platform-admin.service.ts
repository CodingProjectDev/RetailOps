
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  JwtService
} from "@nestjs/jwt";
import {
  compare,
  hash
} from "bcryptjs";
import {
  UserRole
} from "../generated/prisma/enums";
import {
  PrismaService
} from "../prisma/prisma.service";
import {
  PlatformAdminLoginInput
} from "./dto/platform-admin-login.input";
import {
  CreatePlatformBusinessOwnerInput
} from "./dto/create-platform-business-owner.input";
import {
  PlatformAdminDashboardModel,
  PlatformAuditLogModel,
  PlatformBusinessModel,
  PlatformUserModel
} from "./platform-admin.model";

type AdminActor = {
  id: string;
  name: string;
  email: string;
};

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private async issueToken(
    admin: {
      id: string;
      email: string;
    }
  ) {
    return this.jwt.signAsync({
      sub:
        admin.id,
      email:
        admin.email,
      scope:
        "PLATFORM_ADMIN"
    });
  }

  private businessModel(
    business: any
  ): PlatformBusinessModel {
    const users =
      business.users ??
      [];

    const owner =
      users.find(
        (user: any) =>
          user.role ===
          UserRole.OWNER
      );

    const countRole =
      (
        role: UserRole
      ) =>
        users.filter(
          (user: any) =>
            user.role ===
            role
        ).length;

    return {
      id:
        business.id,
      name:
        business.name,
      slug:
        business.slug,
      active:
        business.active,
      ownerName:
        owner?.name ??
        null,
      ownerEmail:
        owner?.email ??
        null,
      storeCount:
        business._count
          ?.stores ??
        0,
      userCount:
        users.length,
      ownerCount:
        countRole(
          UserRole.OWNER
        ),
      managerCount:
        countRole(
          UserRole.MANAGER
        ),
      cashierCount:
        countRole(
          UserRole.CASHIER
        ),
      inventoryClerkCount:
        countRole(
          UserRole.INVENTORY_CLERK
        ),
      createdAt:
        business.createdAt
    };
  }

  private userModel(
    user: any
  ): PlatformUserModel {
    return {
      id:
        user.id,
      name:
        user.name,
      email:
        user.email,
      role:
        user.role,
      active:
        user.active,
      businessId:
        user.businessId,
      businessName:
        user.business
          .name,
      stores:
        (
          user.storeAssignments ??
          []
        ).map(
          (
            assignment: any
          ) => ({
            id:
              assignment
                .store
                .id,
            name:
              assignment
                .store
                .name,
            code:
              assignment
                .store
                .code,
            active:
              assignment
                .store
                .active
          })
        ),
      createdAt:
        user.createdAt
    };
  }

  private async audit(
    actor: AdminActor,
    input: {
      action: string;
      targetType: string;
      targetId?:
        string | null;
      targetLabel?:
        string | null;
      details?:
        string | null;
    }
  ) {
    await this.prisma.platformAuditLog.create({
      data: {
        platformAdminId:
          actor.id,
        action:
          input.action,
        targetType:
          input.targetType,
        targetId:
          input.targetId ??
          null,
        targetLabel:
          input.targetLabel ??
          null,
        details:
          input.details ??
          null
      }
    });
  }


  private slugify(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(
        0,
        60
      );
  }

  private async uniqueBusinessSlug(
    name: string
  ) {
    const base =
      this.slugify(
        name
      ) ||
      "business";

    let candidate =
      base;

    let suffix =
      2;

    while (
      await this.prisma.business.findUnique({
        where: {
          slug:
            candidate
        },
        select: {
          id: true
        }
      })
    ) {
      candidate =
        `${base}-${suffix}`;

      suffix +=
        1;
    }

    return candidate;
  }

  async login(
    input: PlatformAdminLoginInput
  ) {
    const email =
      input.email
        .trim()
        .toLowerCase();

    const admin =
      await this.prisma.platformAdmin.findUnique({
        where: {
          email
        }
      });

    if (
      !admin ||
      !admin.active
    ) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    const valid =
      await compare(
        input.password,
        admin.passwordHash
      );

    if (!valid) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    const updated =
      await this.prisma.platformAdmin.update({
        where: {
          id:
            admin.id
        },
        data: {
          lastLoginAt:
            new Date()
        }
      });

    await this.audit(
      updated,
      {
        action:
          "PLATFORM_ADMIN_LOGIN",
        targetType:
          "PLATFORM_ADMIN",
        targetId:
          updated.id,
        targetLabel:
          updated.email
      }
    );

    return {
      admin:
        updated,
      token:
        await this.issueToken(
          updated
        )
    };
  }


  async createBusinessOwner(
    actor: AdminActor,
    input: CreatePlatformBusinessOwnerInput
  ): Promise<
    PlatformBusinessModel
  > {
    const businessName =
      input.businessName
        .trim();

    const ownerName =
      input.ownerName
        .trim();

    const ownerEmail =
      input.ownerEmail
        .trim()
        .toLowerCase();

    const temporaryPassword =
      input.temporaryPassword;

    if (
      businessName.length <
      2
    ) {
      throw new BadRequestException(
        "Business name must be at least 2 characters"
      );
    }

    if (
      ownerName.length <
      2
    ) {
      throw new BadRequestException(
        "Owner name must be at least 2 characters"
      );
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        ownerEmail
      )
    ) {
      throw new BadRequestException(
        "Owner email must be valid"
      );
    }

    if (
      temporaryPassword.length <
      8
    ) {
      throw new BadRequestException(
        "Temporary password must be at least 8 characters"
      );
    }

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email:
            ownerEmail
        },
        select: {
          id: true
        }
      });

    if (existingUser) {
      throw new BadRequestException(
        "That email is already used by another RetailOps account"
      );
    }

    const slug =
      await this.uniqueBusinessSlug(
        businessName
      );

    const passwordHash =
      await hash(
        temporaryPassword,
        12
      );

    const businessId =
      await this.prisma.$transaction(
        async (
          tx
        ) => {
          const business =
            await tx.business.create({
              data: {
                name:
                  businessName,
                slug,
                active:
                  true
              }
            });

          const owner =
            await tx.user.create({
              data: {
                businessId:
                  business.id,
                name:
                  ownerName,
                email:
                  ownerEmail,
                passwordHash,
                role:
                  UserRole.OWNER,
                active:
                  true
              }
            });

          const mainStore =
            await tx.store.create({
              data: {
                businessId:
                  business.id,
                name:
                  "Main Store",
                code:
                  "MAIN",
                active:
                  true
              }
            });

          await tx.userStore.create({
            data: {
              userId:
                owner.id,
              storeId:
                mainStore.id
            }
          });

          await tx.category.createMany({
            data: [
              {
                businessId:
                  business.id,
                name:
                  "Drinks"
              },
              {
                businessId:
                  business.id,
                name:
                  "Snacks"
              },
              {
                businessId:
                  business.id,
                name:
                  "Other"
              }
            ],
            skipDuplicates:
              true
          });

          return business.id;
        }
      );

    await this.audit(
      actor,
      {
        action:
          "BUSINESS_OWNER_CREATED",
        targetType:
          "BUSINESS",
        targetId:
          businessId,
        targetLabel:
          businessName,
        details:
          `Owner ${ownerName} <${ownerEmail}> created`
      }
    );

    const created =
      await this.prisma.business.findUnique({
        where: {
          id:
            businessId
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              stores: true
            }
          }
        }
      });

    if (!created) {
      throw new NotFoundException(
        "Created business could not be loaded"
      );
    }

    return this.businessModel(
      created
    );
  }

  async dashboard():
    Promise<
      PlatformAdminDashboardModel
    > {
    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      owners,
      managers,
      cashiers,
      inventoryClerks,
      recentBusinesses
    ] =
      await Promise.all([
        this.prisma.business.count(),
        this.prisma.business.count({
          where: {
            active: true
          }
        }),
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            role:
              UserRole.OWNER
          }
        }),
        this.prisma.user.count({
          where: {
            role:
              UserRole.MANAGER
          }
        }),
        this.prisma.user.count({
          where: {
            role:
              UserRole.CASHIER
          }
        }),
        this.prisma.user.count({
          where: {
            role:
              UserRole.INVENTORY_CLERK
          }
        }),
        this.prisma.business.findMany({
          orderBy: {
            createdAt:
              "desc"
          },
          take:
            6,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            _count: {
              select: {
                stores: true
              }
            }
          }
        })
      ]);

    return {
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses:
        totalBusinesses -
        activeBusinesses,
      totalUsers,
      owners,
      managers,
      cashiers,
      inventoryClerks,
      recentBusinesses:
        recentBusinesses.map(
          (
            business
          ) =>
            this.businessModel(
              business
            )
        )
    };
  }

  async businesses(
    search?: string,
    active?: boolean
  ): Promise<
    PlatformBusinessModel[]
  > {
    const clean =
      search?.trim();

    const businesses =
      await this.prisma.business.findMany({
        where: {
          ...(typeof active ===
          "boolean"
            ? {
                active
              }
            : {}),
          ...(clean
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    slug: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    users: {
                      some: {
                        OR: [
                          {
                            name: {
                              contains:
                                clean,
                              mode:
                                "insensitive"
                            }
                          },
                          {
                            email: {
                              contains:
                                clean,
                              mode:
                                "insensitive"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            : {})
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              stores: true
            }
          }
        },
        orderBy: {
          createdAt:
            "desc"
        },
        take:
          250
      });

    return businesses.map(
      (
        business
      ) =>
        this.businessModel(
          business
        )
    );
  }

  async users(
    search?: string,
    role?: UserRole,
    active?: boolean,
    businessId?: string
  ): Promise<
    PlatformUserModel[]
  > {
    const clean =
      search?.trim();

    const users =
      await this.prisma.user.findMany({
        where: {
          ...(role
            ? {
                role
              }
            : {}),
          ...(typeof active ===
          "boolean"
            ? {
                active
              }
            : {}),
          ...(businessId
            ? {
                businessId
              }
            : {}),
          ...(clean
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    email: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    business: {
                      name: {
                        contains:
                          clean,
                        mode:
                          "insensitive"
                      }
                    }
                  }
                ]
              }
            : {})
        },
        include: {
          business: true,
          storeAssignments: {
            include: {
              store: true
            }
          }
        },
        orderBy: [
          {
            business: {
              name:
                "asc"
            }
          },
          {
            role:
              "asc"
          },
          {
            name:
              "asc"
          }
        ],
        take:
          500
      });

    return users.map(
      (
        user
      ) =>
        this.userModel(
          user
        )
    );
  }


  async resetBusinessOwnerPassword(
    actor: AdminActor,
    businessId: string,
    newTemporaryPassword: string
  ): Promise<PlatformUserModel> {
    if (
      !newTemporaryPassword ||
      newTemporaryPassword.length <
        8
    ) {
      throw new BadRequestException(
        "Temporary password must be at least 8 characters"
      );
    }

    const owner =
      await this.prisma.user.findFirst({
        where: {
          businessId,
          role:
            UserRole.OWNER
        },
        include: {
          business: true,
          storeAssignments: {
            include: {
              store: true
            }
          }
        },
        orderBy: {
          createdAt:
            "asc"
        }
      });

    if (!owner) {
      throw new NotFoundException(
        "Business owner account not found"
      );
    }

    const passwordHash =
      await hash(
        newTemporaryPassword,
        12
      );

    const updated =
      await this.prisma.user.update({
        where: {
          id:
            owner.id
        },
        data: {
          passwordHash
        },
        include: {
          business: true,
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    await this.audit(
      actor,
      {
        action:
          "BUSINESS_OWNER_PASSWORD_RESET",
        targetType:
          "USER",
        targetId:
          owner.id,
        targetLabel:
          `${owner.email} · ${owner.business.name}`,
        details:
          "Platform Admin reset the Business OWNER password"
      }
    );

    return this.userModel(
      updated
    );
  }

  async setBusinessActive(
    actor: AdminActor,
    businessId: string,
    active: boolean,
    reason?: string
  ): Promise<
    PlatformBusinessModel
  > {
    const business =
      await this.prisma.business.findUnique({
        where: {
          id:
            businessId
        }
      });

    if (!business) {
      throw new NotFoundException(
        "Business not found"
      );
    }

    if (
      !active &&
      (
        !reason ||
        reason.trim().length <
          3
      )
    ) {
      throw new BadRequestException(
        "Suspension reason must be at least 3 characters"
      );
    }

    await this.prisma.business.update({
      where: {
        id:
          business.id
      },
      data: {
        active
      }
    });

    await this.audit(
      actor,
      {
        action:
          active
            ? "BUSINESS_REACTIVATED"
            : "BUSINESS_SUSPENDED",
        targetType:
          "BUSINESS",
        targetId:
          business.id,
        targetLabel:
          business.name,
        details:
          reason?.trim() ||
          null
      }
    );

    const updated =
      await this.prisma.business.findUnique({
        where: {
          id:
            business.id
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              stores: true
            }
          }
        }
      });

    if (!updated) {
      throw new NotFoundException(
        "Business could not be reloaded"
      );
    }

    return this.businessModel(
      updated
    );
  }

  async setUserActive(
    actor: AdminActor,
    userId: string,
    active: boolean,
    reason?: string
  ): Promise<
    PlatformUserModel
  > {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId
        },
        include: {
          business: true,
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    if (!user) {
      throw new NotFoundException(
        "User not found"
      );
    }

    if (
      !active &&
      (
        !reason ||
        reason.trim().length <
          3
      )
    ) {
      throw new BadRequestException(
        "Deactivation reason must be at least 3 characters"
      );
    }

    const updated =
      await this.prisma.user.update({
        where: {
          id:
            user.id
        },
        data: {
          active
        },
        include: {
          business: true,
          storeAssignments: {
            include: {
              store: true
            }
          }
        }
      });

    await this.audit(
      actor,
      {
        action:
          active
            ? "USER_REACTIVATED"
            : "USER_DEACTIVATED",
        targetType:
          "USER",
        targetId:
          user.id,
        targetLabel:
          `${user.email} · ${user.business.name}`,
        details:
          reason?.trim() ||
          null
      }
    );

    return this.userModel(
      updated
    );
  }

  async auditLogs():
    Promise<
      PlatformAuditLogModel[]
    > {
    const logs =
      await this.prisma.platformAuditLog.findMany({
        include: {
          platformAdmin:
            true
        },
        orderBy: {
          createdAt:
            "desc"
        },
        take:
          250
      });

    return logs.map(
      (
        log
      ) => ({
        id:
          log.id,
        adminName:
          log.platformAdmin
            .name,
        action:
          log.action,
        targetType:
          log.targetType,
        targetId:
          log.targetId,
        targetLabel:
          log.targetLabel,
        details:
          log.details,
        createdAt:
          log.createdAt
      })
    );
  }
}
