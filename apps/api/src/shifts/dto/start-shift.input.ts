import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class StartShiftInput {
  @Field(() => String)
  storeId: string;

  @Field(() => Float)
  openingCash: number;
}
