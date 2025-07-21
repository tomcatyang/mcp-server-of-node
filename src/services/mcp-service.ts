import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import toolService from './tools/tool-service';
import { ToolArgs } from './tools/tool-type';


class McpService {
  private toolNames = toolService.getToolNames();

  public getToolList(): ToolArgs[] {
    return toolService.getToolList();
  }

  public canHandle(toolName: string): boolean {
    return this.toolNames.includes(toolName);
  }

  public async handleTool(toolName: string, args: any) {

    const tool = toolService.getTool(toolName);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `TAPD service cannot handle tool: ${toolName}`);
    }
    const result = await tool.handle(args);
    return result;
  }
} 

export default McpService;