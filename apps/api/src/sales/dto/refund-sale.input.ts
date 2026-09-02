import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class RefundSaleItemInput {
  @Field(() => String)
  saleItemId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Boolean, { defaultValue: true })
  restock: boolean;
}

@InputType()
export class RefundSaleInput {
  @Field(() => String)
  saleId: string;

  @Field(() => String)
  reason: string;

  @Field(() => [RefundSaleItemInput])
  items: RefundSaleItemInput[];
}
