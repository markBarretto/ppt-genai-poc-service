import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import  Ollama from 'ollama';
import { InjectModel } from '@nestjs/mongoose';
import { Prompt, PromptCall } from './models/prompt.schema'
import { ToolService } from './tool/tool.service';
import { template } from './../generate/partials/template';
import { images } from './../generate/partials/images';

@Injectable()
export class PromptService {
  constructor(@InjectModel(Prompt.name) private promptModel: Model<Prompt>, private configService: ConfigService, private toolService: ToolService){}

  async create(createPromptDto: CreatePromptDto) {
    const { role, content, id } = createPromptDto;

    const resp = await this.callModel(id, role, content);

    return  resp;
  }

  async callModel(id: string, role: string, content: string, history?: PromptCall[], model?: string) {
    try {
      let tempHist = [];
      let respId = '';//await this.upsertPromptRecord(role, content, id);
      
      const toolCalled = (toolname) => new RegExp(toolname);
      const toolCalls =  this.toolService.getToolNames().filter((toolName)=>{
        return toolCalled(toolName).test(content);
      })
      toolCalls.forEach(async (call)=>{
         switch (call) {
          // prompt engineering add context
          case 'post_generate_pptx':
            tempHist.push({role, content: template});
            tempHist.push({role, content: images});
            break;
          default:
            break;
        }
      })
      
      // save first for 
      if (tempHist.length > 0 ) { 
        respId = await this.upsertPromptRecord(tempHist[0]?.role, tempHist[0]?.content)
      }

      await Promise.allSettled([, ...tempHist].map(async (hist) =>{
        const { role, content } = hist;
        return await this.upsertPromptRecord(role, content, respId);
      }));

      tempHist.push({role,content});

      if (!respId) {
        respId = await this.upsertPromptRecord(role, content, id);
      } else {
        await this.upsertPromptRecord(role, content, respId)
      }

      const resp = await Ollama.chat({
        model: model || "llama3.1",
        messages: [ 
          ...(history || tempHist),
          { role, content },
        ], 
        tools: this.toolService.getTools(toolCalls)
      });

      const { role: respRole, content: respContent} = resp?.message;
      await this.upsertPromptRecord(respRole, respContent, id || respId);
      
      const { tool_calls } = resp?.message;

      if (tool_calls) {
        await Promise.allSettled(tool_calls.map(call=> {
          const { name, arguments: args } = call?.function;
          // await tool call
          return this.callTool(name, args, id);
        }));
      }

    } catch (e) {
      throw `error calling model ${e}`;
    }
  }

  async callTool(name: string, args: any, id: string) {
    try {
      if (!this.toolService[name] && typeof this.toolService[name] !== 'function') {
        throw `error tool ${name} does not exist or is not a function`
      }
      await this.upsertPromptRecord('tool', `call function ${name}`, id);

      const toolResp = await this.toolService[name](args);
      await this.upsertPromptRecord('tool', `called function ${name}`, id);
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
