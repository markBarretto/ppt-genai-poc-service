import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGenerateDto } from './dto/create-generate.dto';
import { UpdateGenerateDto } from './dto/update-generate.dto';
import { PptService } from './ppt/ppt.service';
import { PptGen } from './models/pptgen.schema';

export class GenerateService {
  constructor(@InjectModel(PptGen.name) private pptGenModel: Model<PptGen>, private pptService: PptService) {}
  
  async create(createGenerateDto: CreateGenerateDto) {
    try {
      let now = new Date();

      const { presentationInput } = createGenerateDto;

      const pptGen = await this.pptGenModel.create({
        owner: 'user', // update after authentication established take from token
        status: "pending",
        payload: presentationInput,
        createAt: now,
        updatedAt: now,
      });

      const { _id } = pptGen;

      const { file: filePath, binary } = await this.pptService.generatePpt(presentationInput);

      await this.pptGenModel.updateOne({_id}, {
        filePath,
        binary,
        updatedAt: new Date(),
      })

      return _id;
    } catch(e) {
      console.log(e); // TODO centralized logging
    }
  }

  findAll() {
    return this.pptGenModel.find();
  }

  findOne(id: number) {
    return this.pptGenModel.findById(id);
  }

  update(id: number, updateGenerateDto: UpdateGenerateDto) {
    return this.pptGenModel.findByIdAndUpdate(id, updateGenerateDto);
  }

  remove(id: number) {
    return this.pptGenModel.deleteOne({id});
  }
}
