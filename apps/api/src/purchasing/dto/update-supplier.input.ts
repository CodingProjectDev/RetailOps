import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateSupplierInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  contactName?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}
