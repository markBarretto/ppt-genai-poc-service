import { Controller, Get } from '@nestjs/common';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {

    constructor(private imageService: ImageService) {}
  @Get()
  listImages(): any {
    try {
      return this.imageService.list();
    } catch(e){
      console.log(e);
    }
  }
}
