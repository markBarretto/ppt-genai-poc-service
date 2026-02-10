export class CreatePromptDto {
    public id?: string;
    public role: string;
    public content: string;
    public history?: any[];
}
