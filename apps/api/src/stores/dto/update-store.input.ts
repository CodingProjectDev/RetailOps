import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class UpdateStoreInput {
  @Field()
  id: string;

  @Field(() => String, {
    nullable: true
  })
  name?: string;

  @Field(() => String, {
    nullable: true
  })
  code?: string;

  @Field(() => String, {
    nullable: true
  })
  address?: string;

  @Field(() => String, {
    nullable: true
  })
  phone?: string;

  @Field(() => Boolean, {
    nullable: true
  })
  active?: boolean;
}
