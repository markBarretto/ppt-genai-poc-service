import { Injectable } from '@nestjs/common';
import { Automizer, modify } from 'pptx-automizer';
import * as path from 'path';
import * as fs from 'fs';

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
    private outputDirectory: string;

    constructor() {
        this.template = `TEMPLATE_2026.pptx`; // TODO create template model and crud
        this.templateDirectory = 'templates';
        this.outputDirectory = 'output';
        
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

    async generatePpt(inputTemplate: Slide[]) {
        this.automizer.load(path.join(__dirname, '..','..','..','workspace', this.templateDirectory, this.template), 'root');

        inputTemplate.forEach(async slide=>{
            const { templateName, contentSections } = slide;
            const template = templateMap[templateName];

            if (!template) {
                throw new Error(`template: ${templateName} is not a valid template`)
            }

            const { id, sectionAlias } = template;

            await this.automizer.addSlide('root', id, (s)=>{
                Object.keys(contentSections).forEach((sectionName)=>{

                    if(!sectionAlias[sectionName]) {
                        return; // TODO handle template section not found
                    }

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
                        ])
                    );
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
