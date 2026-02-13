import { Injectable } from '@nestjs/common';

// const { ExifImage } = require('exif');
import * as piexif from 'piexifjs';
import * as path from 'path';
import * as fs from 'fs';
import Ollama from 'ollama';

@Injectable()
export class ImageService {

    private imageDirectory: string = 'images';
    private model: string = 'llava';

    async listImages(path) {
        let files;
        files = await fs.readdirSync(path);
        return files;
    }

    async getImageBinary(filename: string) {
        return await fs.readFileSync(path.join(__dirname, '..','..','..','workspace', this.imageDirectory,filename), "binary");
    }

    async getImageDescription(filename: string) {
        const imageBinary = await this.getImageBinary(filename); 
        return piexif.load(imageBinary)["0th"][piexif.ImageIFD.ImageDescription];
    }

    async setImageDescription(filename: string, description: string) {
        const imageBinary = await this.getImageBinary(filename); 
        const temp = piexif.load(imageBinary)["0th"][piexif.ImageIFD.ImageDescription] = description;
        
        const exifBytes = piexif.dump(Object.assign({}, temp));
        const output = piexif.insert(exifBytes, imageBinary);

        fs.writeFileSync(filename, output, "binary");
    }

    async generateImageDescription(binary: string) {
        const b = await this.getImageBinary(binary);
        const buff = Buffer.from(b, 'utf-8');
        const resp = await Ollama.chat({
            model: this.model,
            messages: [
                {
                    role: "user",
                    content: "Describe image"
                },
                {
                    role: "user",
                    images: [ buff.toString('base64') ]
                }
            ]
        });
        return resp?.message;
    }

    async listImageDescriptions() {
        const images = await this.listImages(path.join(__dirname, '..','..','..','workspace', this.imageDirectory));
        const output = await Promise.allSettled(images.map(async (image) => {
            let o = {};
            let desc = await this.getImageDescription(image);

            if (!desc || desc == 'default') {
                const resp = await this.generateImageDescription(image);
                desc = resp?.content
                // generate description with AI
                // this.setImageDescription(image, `LLAVA GEN: ${desc}`);
            }
            o[image] = desc;
            return o;
        }));
        return output.map((x:any)=>x?.value).filter(x=>x);
    }

    async list() {
        const i = await this.listImageDescriptions();
        return i;
    }
}

