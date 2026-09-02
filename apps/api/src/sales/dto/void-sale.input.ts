import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class VoidSaleInput {
  @Field(() => String)
  saleId: string;

  @Field(() => String)
  reason: string;
}
