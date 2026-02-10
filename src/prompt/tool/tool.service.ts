import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ToolService {
    private pptGenUrl: string;
    private methodMeta: any = { // tool call meta data TODO move tools into separate collection 
        post_generate_pptx: {
            description: 'generates pptx based on json input',
            parameter_descriptions: {
                presentationInput: { type: 'object', description: 'JSON input property for generating PPTX', required: true}
            } 
        }
    }

    constructor(private config: ConfigService) {
        this.pptGenUrl = this.config.get('PPTX_GEN_URL');
    }

    logMethodParams(propertyKey: string) {
        const { description, parameter_descriptions } = this.methodMeta[propertyKey];
        return {
            type: 'function',
            function: { 
                name: propertyKey,
                description, 

                parameters: { 
                    type: 'object',
                    properties: Object.keys(parameter_descriptions).reduce((acc: any, name: any, index) => {
                        const { type, description } = parameter_descriptions[name] 
                        acc[name] = { 
                            type, 
                            description 
                        };
                        return acc;
                    }, {}),
                    required: Object.keys(parameter_descriptions).filter(x=> parameter_descriptions[x].required)
                }
            }
        }
    }

    getTools() {
        const ignoreMethods = ['constructor', 'logMethodParams', 'getTools'];
        const methods: any[] = Reflect.ownKeys(Object.getPrototypeOf(this)).filter(m => !ignoreMethods.find(i=>i==m) && typeof this[m] === 'function');
        return methods.map(m=>this.logMethodParams(m))
    }

    async post_generate_pptx(args: any) {
        const { presentationInput: p } = JSON.parse(JSON.stringify(args));
        const presentationInput = JSON.parse(JSON.stringify(p));
        return axios.post(`${this.pptGenUrl}/generate`, { presentationInput });
    }
}
