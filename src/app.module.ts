import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromptModule } from './prompt/prompt.module';
import { GenerateModule } from './generate/generate.module';

@Module({
  imports: [ 
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(`mongodb://localhost:27017/ppt-poc`, {}),
    RouterModule.register([
      {
        path: '', 
        module: PromptModule,
      },
      {
        path: '',
        module: GenerateModule,
      },
    ]),
    PromptModule, 
    GenerateModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
