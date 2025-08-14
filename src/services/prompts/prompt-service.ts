import { PromptArgs, PromptResult } from '../tools/tool-type';

class PromptService {
    private prompts: PromptArgs[] = [];

    constructor() {
    }

    addPrompt(prompt: PromptArgs) {
        this.prompts.push(prompt);
    }

    addPrompts(prompts: PromptArgs[]) {
        this.prompts.push(...prompts);
    }

    getPromptNames(): string[] {
        return this.prompts.map(prompt => prompt.name);
    }

    getPromptList(): PromptArgs[] {
        return this.prompts;
    }

    getPrompt(name: string): PromptArgs | undefined {
        return this.prompts.find(prompt => prompt.name === name);
    }

    async handlePrompt(name: string, args: any): Promise<PromptResult> {
        const prompt = this.getPrompt(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }
        return await prompt.handle(args);
    }
}

export default new PromptService();

