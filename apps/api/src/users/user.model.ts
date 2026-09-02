import {
  Field,
  ObjectType,
  registerEnumType
} from "@nestjs/graphql";
import { UserRole } from "../generated/prisma/enums";

registerEnumType(
  UserRole,
  {
    name: "UserRole"
  }
);

@ObjectType("User")
export class UserModel {
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

  @Field(() => String, {
    nullable: true
  })
  businessId?: string | null;

  @Field()
  createdAt: Date;
}
