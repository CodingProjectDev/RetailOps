
import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class PlatformAdminLoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
