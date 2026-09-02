import {
  Field,
  ObjectType
} from "@nestjs/graphql";

@ObjectType()
export class BusinessModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  active: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
