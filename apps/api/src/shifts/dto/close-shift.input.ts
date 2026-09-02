import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class CloseShiftInput {
  @Field(() => Float)
  actualCash: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}
