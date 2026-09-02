import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class AdjustInventoryInput {
  @Field()
  productId: string;

  @Field(() => Int)
  quantityChange: number;

  @Field()
  reason: string;
}
