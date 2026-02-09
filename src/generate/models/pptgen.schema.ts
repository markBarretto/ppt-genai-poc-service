import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

enum Status {
    pending = "pending",
    complete = "complete"
}

@Schema({ timestamps: true })
export class PptGen extends Document {

@Prop({ required: true, type: MongooseSchema.Types.String })
owner: string;

@Prop({ type: MongooseSchema.Types.Mixed })
filePath?: any;

@Prop({ type: MongooseSchema.Types.Mixed })
binary?: any;

@Prop({ type: String,
    enum: Status, 
    default: Status.pending,
})
status: string;

@Prop({ type: MongooseSchema.Types.Mixed })
payload?: any;

@Prop({ type: MongooseSchema.Types.Date})
createdAt?: Date;

@Prop({ type: MongooseSchema.Types.Date})
updatedAt?: Date;
}

export const PptGenSchema = SchemaFactory.createForClass(PptGen);