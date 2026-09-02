import {
  Field,
  InputType
} from "@nestjs/graphql";
import { UserRole } from "../../generated/prisma/enums";

@InputType()
export class CreateStoreStaffInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => [String])
  storeIds: string[];
}
