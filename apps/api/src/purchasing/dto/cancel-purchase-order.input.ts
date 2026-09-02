import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CancelPurchaseOrderInput {
  @Field(() => String)
  purchaseOrderId: string;

  @Field(() => String)
  reason: string;
}
