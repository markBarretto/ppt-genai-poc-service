import { Module } from '@nestjs/common';
import { GenerateService } from './generate.service';
import { GenerateController } from './generate.controller';
import { PptService } from './ppt/ppt.service';

import { MongooseModule } from '@nestjs/mongoose';
import { PptGen, PptGenSchema } from './models/pptgen.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PptGen.name, schema: PptGenSchema }])],
  controllers: [GenerateController],
  providers: [
    GenerateService, 
    PptService
  ],
})
export class GenerateModule {}
