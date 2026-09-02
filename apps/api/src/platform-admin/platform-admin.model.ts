
import {
  Field,
  Int,
  ObjectType
} from "@nestjs/graphql";
import { UserRole } from "../generated/prisma/enums";

@ObjectType()
export class PlatformAdminModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  active: boolean;

  @Field(() => Date, {
    nullable: true
  })
  lastLoginAt?: Date | null;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PlatformUserStoreModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  active: boolean;
}

@ObjectType()
export class PlatformUserModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  active: boolean;

  @Field()
  businessId: string;

  @Field()
  businessName: string;

  @Field(() => [
    PlatformUserStoreModel
  ])
  stores: PlatformUserStoreModel[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PlatformBusinessModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  active: boolean;

  @Field(() => String, {
    nullable: true
  })
  ownerName?: string | null;

  @Field(() => String, {
    nullable: true
  })
  ownerEmail?: string | null;

  @Field(() => Int)
  storeCount: number;

  @Field(() => Int)
  userCount: number;

  @Field(() => Int)
  ownerCount: number;

  @Field(() => Int)
  managerCount: number;

  @Field(() => Int)
  cashierCount: number;

  @Field(() => Int)
  inventoryClerkCount: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PlatformAdminDashboardModel {
  @Field(() => Int)
  totalBusinesses: number;

  @Field(() => Int)
  activeBusinesses: number;

  @Field(() => Int)
  suspendedBusinesses: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  owners: number;

  @Field(() => Int)
  managers: number;

  @Field(() => Int)
  cashiers: number;

  @Field(() => Int)
  inventoryClerks: number;

  @Field(() => [
    PlatformBusinessModel
  ])
  recentBusinesses: PlatformBusinessModel[];
}

@ObjectType()
export class PlatformAuditLogModel {
  @Field()
  id: string;

  @Field()
  adminName: string;

  @Field()
  action: string;

  @Field()
  targetType: string;

  @Field(() => String, {
    nullable: true
  })
  targetId?: string | null;

  @Field(() => String, {
    nullable: true
  })
  targetLabel?: string | null;

  @Field(() => String, {
    nullable: true
  })
  details?: string | null;

  @Field()
  createdAt: Date;
}
