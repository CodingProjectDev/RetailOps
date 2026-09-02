import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateSupplierInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  contactName?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  address?: string;
}
