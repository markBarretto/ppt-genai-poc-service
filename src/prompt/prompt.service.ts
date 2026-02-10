import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import  Ollama from 'ollama';
import { InjectModel } from '@nestjs/mongoose';
import { Prompt, PromptCall } from './models/prompt.schema'
import { ToolService } from './tool/tool.service';

@Injectable()
export class PromptService {
  constructor(@InjectModel(Prompt.name) private promptModel: Model<Prompt>, private configService: ConfigService, private toolService: ToolService){}

  async create(createPromptDto: CreatePromptDto) {
    const { role, content, id } = createPromptDto;
    const resp = await this.callModel(role, content);
    const respId = await this.upsertPromptRecord(role, content);

    const { role: respRole, content: respContent } = resp?.message;
    await this.upsertPromptRecord(respRole, respContent, id || respId);

    let output = Object.assign(resp,{
      id: id || respId
    });

    return  output;
  }

  async callModel(role, content, history?: PromptCall[], model?: string) {
    try {
      const resp = await Ollama.chat({
        model: model || "llama3.1",
        messages: [ 
          ...(history || []),
          { role, content },
        ], 
        tools: this.toolService.getTools()
      });

      const { tool_calls } = resp?.message;

      // TODO fix logging before tool call

      if (tool_calls) {
        await Promise.allSettled(tool_calls.map(call=> {
          const { name, arguments: args } = call?.function;
          // await tool call
          return this.callTool(name, args)
        }));
      }
      return resp;
    } catch (e) {
      throw `error calling model ${e}`;
    }
  }

  async callTool(name: string, args: any) {
    try {
      if (!this.toolService[name] && typeof this.toolService[name] !== 'function') {
        throw `error tool ${name} does not exist or is not a function`
      }

      const toolResp = await this.toolService[name](args);
      await this.upsertPromptRecord('tool', toolResp, `call function ${name}`);
    } catch(e) {
      throw `error calling tool: ${e}`
    }
  }
  
  async upsertPromptRecord(role, content, id?: string) {
    let p;
    try {
      if (!id) {
        p = await this.promptModel.create({ role, content });
      } else {
        p = await this.promptModel.findById(id);
        
        const { role: prevRole, content: prevContent, history} = p;
        history.push({ role: prevRole, content: prevContent});

        await this.promptModel.findByIdAndUpdate(id, { role, content, history });
      }
      
      return id || p?._id;
    } catch (e) {
      throw `error updating prompt ${id || p?._id}: ${e}`;
    }
    
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
