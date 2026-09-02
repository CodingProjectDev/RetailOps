import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreatePurchaseOrderItemInput {
  @Field(() => String)
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitCost: number;
}

@InputType()
export class CreatePurchaseOrderInput {
  @Field(() => String)
  supplierId: string;

  @Field(() => [CreatePurchaseOrderItemInput])
  items: CreatePurchaseOrderItemInput[];

  @Field(() => String, { nullable: true })
  notes?: string;
}
