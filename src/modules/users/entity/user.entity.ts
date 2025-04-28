import { ERolesUser, EStatusUser } from '../enums/index.enum';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = HydratedDocument<User>;

@Schema({
	timestamps: {
		createdAt: 'createdAt',
		updatedAt: 'updatedAt',
	},
	toJSON: {
		getters: true,
		virtuals: true,
	},
})
export class User extends BaseEntity {
  @Prop({ length: 500 })
  name: string;

  @Prop({ enum: ERolesUser, default: ERolesUser.USER })
  role: ERolesUser;

  @Prop({ enum: EStatusUser, default: EStatusUser.INACTIVE })
  status: EStatusUser;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop({
    required: false,
    default: null,
  })
  currentAccessToken: string;

  @Prop({
    required: false,
    default: null,
  })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ createdAt: -1 });
UserSchema.index({ fullName: -1 });

export const UserSchemaFactory = () => {
	const userSchema = UserSchema;

	return userSchema;
};
