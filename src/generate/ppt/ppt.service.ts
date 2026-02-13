import { Injectable } from '@nestjs/common';
import { Automizer, modify, ModifyImageHelper, ModifyShapeHelper, CmToDxa } from 'pptx-automizer';
import * as path from 'path';
import * as fs from 'fs';
import { ImageService } from '../image/image.service.js';

// TODO create schema and import script to generate json from ppt mapping of template area XML 
import { template as templateMap } from './templateNameMap.js';

interface ContentFields {
    tile?: string,
    subtitle?: string,
    text?: string,
    highlight?: string,
    highlight1?: string,
    highlight2?: string,
    highlight3?: string,    
}

interface Slide {
    templateName: string,
    contentSections: any // ContentFields
}

@Injectable()
export class PptService {

    private automizer: Automizer;
    private template: string;
    private templateDirectory: string;
    private imageDirectory: string;
    private outputDirectory: string;

    constructor(private imageService: ImageService) {
        this.template = `TEMPLATE_2026.pptx`; // TODO create template model and crud
        this.templateDirectory = 'templates';
        this.outputDirectory = 'output';
        this.imageDirectory = 'images'
        
        this.automizer = new Automizer({
            templateDir: path.join(__dirname, '..','..','..','workspace', this.templateDirectory),
            rootTemplate: path.join(__dirname, '..','..','..','workspace', this.templateDirectory, this.template),
            outputDir: path.join(__dirname, '..','..','..','workspace', this.outputDirectory),
            removeExistingSlides: true
        });
    }

    async writeOutputFile(output) {
        const res = await output.generateAsync({type: 'nodebuffer'})
        const outputFile = path.join(__dirname, '..','..','..','workspace', this.outputDirectory, `${this.template.split('.')[0]}_output_${Date.now()}.pptx`);
        await fs.writeFileSync(outputFile, res);
        return outputFile;
    }

    async writeBinaryString(output) {
        const res = output.generateAsync({ type: 'base64'});
        return res;
    }

    deepFindKeyPaths(data, targetKey, currentPath = "", paths = []) {
        if (data && typeof data === "object") {
            for (let key in data) {
                if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

                // Build the path (dot notation for objects, bracket for arrays)
                const newPath = Array.isArray(data)
                    ? `${currentPath}[${key}]`
                    : (currentPath ? `${currentPath}.${key}` : key);

                // If the key matches, store the path
                if (key === targetKey) {
                    paths.push(newPath);
                }

                // Recurse into nested objects/arrays
                this.deepFindKeyPaths(data[key], targetKey, newPath, paths);
            }
        }
        return paths;
    }

    getValueFromPath(obj, path, defaultValue = undefined) {
        if (obj == null) return defaultValue;

        // Convert path string to array if needed
        let keys = Array.isArray(path)
            ? path
            : path
                .replace(/\[(\w+)\]/g, '.$1') // convert [0] to .0
                .replace(/^\./, '')           // remove leading dot
                .split('.');

        // Traverse the object
        let result = obj;
        for (let key of keys) {
            if (result != null && Object.prototype.hasOwnProperty.call(result, key)) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        return result;
    }

    loadImagesFromInput(inputTemplate){
        const paths = this.deepFindKeyPaths(inputTemplate, 'picture', '', []);
        return paths.map(path=>this.getValueFromPath(inputTemplate, path));        
    }

    async generatePpt(inputTemplate: Slide[]) {
        this.automizer.load(path.join(__dirname, '..','..','..','workspace', this.templateDirectory, this.template), 'root');
        const tempDir = path.join(__dirname, '..','..','..','workspace', this.imageDirectory);
        const imageList = this.loadImagesFromInput(inputTemplate);

        imageList.forEach(image=>{
            this.automizer.loadMedia(image, path.join(__dirname, '..','..','..','workspace', this.imageDirectory), 'pre_');
        })
        // this.automizer.loadMedia(imageList, path.join(__dirname, '..','..','..','workspace', this.imageDirectory));

        inputTemplate.forEach(async slide=>{
            const { templateName, contentSections } = slide;
            const template = templateMap[templateName];

            if (!template) {
                throw new Error(`template: ${templateName} is not a valid template`)
            }

            const { id, sectionAlias, imgDimensions } = template;
            const { height, width, h, v } = imgDimensions || {};

            await this.automizer.addSlide('root', id, (s)=>{
                Object.keys(contentSections).forEach((sectionName, index)=>{

                    if(!sectionAlias[sectionName]) {
                        return; // TODO handle template section not found
                    }

                    if (!sectionName.match('picture')) {
                        // replace template elements from input
                        s.modifyElement(
                            sectionAlias[sectionName],
                            modify.replaceText([
                                {
                                    replace: sectionName,
                                    by: {
                                    text: contentSections[sectionName],
                                    },
                                },
                            ]),
                        );
                    } else {
                        s.addElement('root', id, sectionAlias[sectionName], [
                            ModifyShapeHelper.setPosition({
                                w: CmToDxa(width),
                                h: CmToDxa(height),
                            }),
                            ModifyImageHelper.setRelationTarget(contentSections[sectionName]),
                        ]);
                        // s.modifyElement(sectionAlias[sectionName], [
                            // ModifyImageHelper.setRelationTargetCover(
                            //     // path.join(__dirname, '..','..','..','workspace', this.imageDirectory, contentSections[sectionName]), 
                            //     contentSections[sectionName],
                            //     this.automizer
                            // ),

                            // ModifyImageHelper.setRelationTarget(
                            //     // path.join(__dirname, '..','..','..','workspace', this.imageDirectory, sectionAlias[sectionName]),    
                            //     contentSections[sectionName],
                            // ),

                            // ModifyShapeHelper.setPosition({
                            //     w: CmToDxa(width),
                            //     h: CmToDxa(height),
                            // }),
                            
                        // ]);

                    }

                    
                })
            })
        })

        const output = await this.automizer.getJSZip();
        const [ file, binary ] = await Promise.allSettled([
            this.writeOutputFile(output),
            this.writeBinaryString(output)
        ])

        return {
            file, binary
        }
    }

}
