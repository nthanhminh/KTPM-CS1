import { HydratedDocument, Mongoose } from 'mongoose';
import { BaseEntity } from '@modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UrlDocument = HydratedDocument<Url>;

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
export class Url extends BaseEntity {
    @Prop({ length: 500, required: true })
    longUrl: string;

    @Prop({ length: 500, required: true })
    shortUrl: string;

    @Prop({ type: Date, expires: 0, required: true })
    expiresAt: Date;

    @Prop({ required: true })
    userId: string
}

export const UrlSchema = SchemaFactory.createForClass(Url);
UrlSchema.index({ longUrl: -1 });
UrlSchema.index({ shortUrl: -1 });

export const UrlSchemaFactory = () => {
    const urlSchema = UrlSchema;

    return urlSchema;
};
