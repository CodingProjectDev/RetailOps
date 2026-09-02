import {
  Field,
  InputType,
  Int,
  registerEnumType
} from "@nestjs/graphql";
import { PaymentMethod } from "../../generated/prisma/enums";

registerEnumType(
  PaymentMethod,
  {
    name: "PaymentMethod"
  }
);

@InputType()
export class SaleItemInput {
  @Field()
  productId: string;

  @Field(() => Int)
  quantity: number;
}

@InputType()
export class CompleteSaleInput {
  @Field(() => String)
  storeId: string;

  @Field(() => [SaleItemInput])
  items: SaleItemInput[];

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;
}
