import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class ReceivePurchaseOrderItemInput {
  @Field(() => String)
  purchaseOrderItemId: string;

  @Field(() => Int)
  quantity: number;
}

@InputType()
export class ReceivePurchaseOrderInput {
  @Field(() => String)
  purchaseOrderId: string;

  @Field(() => [ReceivePurchaseOrderItemInput])
  items: ReceivePurchaseOrderItemInput[];
}
