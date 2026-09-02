import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateEmployeeInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
