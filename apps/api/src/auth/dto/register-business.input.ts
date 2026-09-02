import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterBusinessInput {
  @Field()
  businessName: string;

  @Field()
  ownerName: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
