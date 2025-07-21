import { ToolArgs } from "./tool-type";

class ToolService {
    private tools: ToolArgs[] = [];

    constructor() {
    }

    addTool(tool: ToolArgs) {
        this.tools.push(tool);
    }

    addTools(tools: ToolArgs[]) {
        this.tools.push(...tools);
    }

    getToolNames(): string[] {
        const toolNames = this.tools.map(tool => tool.name);
        return toolNames;
    }

    getToolList(): ToolArgs[] {
        return this.tools;
    }

    getTool(name: string): ToolArgs | undefined {
        const tool = this.tools.find(tool => tool.name === name);
        return tool;
    }
}

export default new ToolService();