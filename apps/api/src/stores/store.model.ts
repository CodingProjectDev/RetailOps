import {
  Field,
  ObjectType
} from "@nestjs/graphql";
import { UserRole } from "../generated/prisma/enums";

@ObjectType()
export class StoreModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => String, {
    nullable: true
  })
  address?: string | null;

  @Field(() => String, {
    nullable: true
  })
  phone?: string | null;

  @Field()
  active: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class StoreStaffModel {
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

  @Field(() => [StoreModel])
  stores: StoreModel[];
}
