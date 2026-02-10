import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';
import { Prompt, PromptSchema } from './models/prompt.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ToolService } from './tool/tool.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }])],
  controllers: [PromptController],
  providers: [PromptService, ToolService],
})
export class PromptModule {}
