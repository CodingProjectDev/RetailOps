import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class CreateStoreInput {
  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => String, {
    nullable: true
  })
  address?: string;

  @Field(() => String, {
    nullable: true
  })
  phone?: string;
}
