import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import toolService from './tools/tool-service';
import resourceService from './resources/resource-service';
import promptService from './prompts/prompt-service';
import { ToolArgs, ResourceArgs, PromptArgs } from './tools/tool-type';

class McpService {
  private toolNames = toolService.getToolNames();
  private resourceNames = resourceService.getResourceNames();
  private promptNames = promptService.getPromptNames();

  // Tools 相关方法
  public getToolList(): ToolArgs[] {
    return toolService.getToolList();
  }

  public canHandleTool(toolName: string): boolean {
    return this.toolNames.includes(toolName);
  }

  public async handleTool(toolName: string, args: any) {
    const tool = toolService.getTool(toolName);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Service cannot handle tool: ${toolName}`);
    }
    const result = await tool.handle(args);
    return result;
  }

  // Resources 相关方法
  public getResourceList(): ResourceArgs[] {
    return resourceService.getResourceList();
  }

  public canHandleResource(uri: string): boolean {
    return this.resourceNames.includes(uri);
  }

  public async getResourceContent(uri: string, args: object) {
    const content = await resourceService.getResourceContent(uri, args);
    if (!content) {
      throw new McpError(ErrorCode.MethodNotFound, `Resource not found: ${uri}`);
    }
    return content;
  }

  // Prompts 相关方法
  public getPromptList(): PromptArgs[] {
    return promptService.getPromptList();
  }

  public canHandlePrompt(promptName: string): boolean {
    return this.promptNames.includes(promptName);
  }

  public async handlePrompt(promptName: string, args: any) {
    try {
      const result = await promptService.handlePrompt(promptName, args);
      return result;
    } catch (error) {
      throw new McpError(ErrorCode.MethodNotFound, `Prompt not found: ${promptName}`);
    }
  }
}

export default McpService;