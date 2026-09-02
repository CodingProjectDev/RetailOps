import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class UpdateBusinessInput {
  @Field(() => String)
  name: string;
}
