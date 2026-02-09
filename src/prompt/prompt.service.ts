import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { Ollama } from 'ollama';


@Injectable()
export class PromptService {
  constructor(private configService: ConfigService){
    
  }

  create(createPromptDto: CreatePromptDto) {
    return 'This action adds a new prompt';
  }

  findAll() {
    return `This action returns all prompt`;
  }

  findOne(id: number) {
    return `This action returns a #${id} prompt`;
  }

  update(id: number, updatePromptDto: UpdatePromptDto) {
    return `This action updates a #${id} prompt`;
  }

  remove(id: number) {
    return `This action removes a #${id} prompt`;
  }
}
