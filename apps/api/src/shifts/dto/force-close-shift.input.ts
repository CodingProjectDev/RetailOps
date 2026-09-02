import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class ForceCloseShiftInput {
  @Field(() => String)
  shiftId: string;

  @Field(() => Float)
  actualCash: number;

  @Field(() => String)
  reason: string;
}
