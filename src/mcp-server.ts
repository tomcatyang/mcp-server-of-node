import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import McpService from './services/mcp-service';


export class MCPServer {
    private server: Server;
    private mcpService: McpService;

    constructor() {
        this.server = new Server(
            {
                name: 'mcp-server-of-node',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.mcpService = new McpService();
        this.setupHandlers();
    }

    private setupHandlers() {
        // 设置工具列表处理器
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    // TAPD工具
                    ...this.mcpService.getToolList(),
                ],
            };
        });

        // 设置工具调用处理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const args = request.params.arguments;

            try {
                // TAPD工具处理
                if (this.mcpService.canHandle(toolName)) {
                    const result = await this.mcpService.handleTool(toolName, args);
                    return result;
                }

                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${toolName}`
                );
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }

                // 将其他错误转换为MCP错误
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error}`
                );
            }
        });
    }

    public async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('TAPD MCP服务器已启动');
    }

    public stop(): void {
        this.server.close();
    }
} 