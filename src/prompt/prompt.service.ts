import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, ObjectId } from 'mongoose';

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
      let prePrompts = [];
            
      const toolCalled = (toolname) => new RegExp(toolname);
      let toolCalls =  this.toolService.getToolNames().filter((toolName)=>{
        return toolCalled(toolName).test(content);
      })

      toolCalls.forEach(async (call)=>{
         switch (call) {
          // prompt engineering add context
          case 'post_generate_pptx':
            prePrompts.push({role, content: template});
            prePrompts.push({role, content: images});
            break;
          default:
            break;
        }
      })

      let pId = await this.upsertPromptRecord(role, content, id);
      const prompt = await this.promptModel.findById(pId);
      const { history, _id } = prompt;
      const promptId = _id.toString()
      prePrompts.map(p=>{
        const { role, content } = p
        return this.upsertPromptRecord(role, content, promptId);
      });
      
      const resp = await Ollama.chat({
        model: model || "llama3.1",
        messages: [ 
          ...Object.keys(history).map(x=>history[x]),
          ...prePrompts,
          { role, content },
        ], 
        tools: this.toolService.getTools(toolCalls)
      });

      const { role: respRole, content: respContent} = resp?.message;
      await this.upsertPromptRecord(respRole, respContent, promptId);
      
      const { tool_calls } = resp?.message;

      let toolCallsResp;

      if (tool_calls) {
        toolCallsResp = await Promise.allSettled(tool_calls.map(call=> {
          const { name, arguments: args } = call?.function;
          return this.callTool(name, args, promptId);
        }));
      }

      return Object.assign({}, toolCallsResp || resp, { promptId });

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

      return toolResp;
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
