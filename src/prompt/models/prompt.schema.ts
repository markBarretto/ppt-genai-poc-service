import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export interface PromptCall {
    role: string,
    content: string
}

@Schema({ timestamps: true })
export class Prompt extends Document {

@Prop({ required: true, type: MongooseSchema.Types.Array })
history: PromptCall[];

@Prop({ required: true, type: MongooseSchema.Types.String })
role: string;

@Prop({ required: true, type: MongooseSchema.Types.String })
content: string

@Prop({ type: MongooseSchema.Types.Date})
createdAt?: Date;

@Prop({ type: MongooseSchema.Types.Date})
updatedAt?: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);