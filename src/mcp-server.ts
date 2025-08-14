import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ListPromptsRequestSchema,
    ReadResourceRequestSchema,
    GetPromptRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import McpService from './services/mcp-service';
import { Log } from './log';

export class MCPServer {
    private server: Server;
    private mcpService: McpService;

    constructor() {
        // 设置MCP模式
        Log.setMcpMode(true);
        this.server = new Server(
            {
                name: 'mcp-server-of-node',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                    resources: {
                        subscribe: true,
                    },
                    prompts: {},
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
                tools: this.mcpService.getToolList(),
            };
        });

        // 设置资源列表处理器
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: this.mcpService.getResourceList(),
            };
        });

        // 设置提示词列表处理器
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: this.mcpService.getPromptList(),
            };
        });

        // 设置工具调用处理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const args = request.params.arguments;

            try {
                if (this.mcpService.canHandleTool(toolName)) {
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

                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error}`
                );
            }
        });

        // 设置资源读取处理器
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri;
            const args = request.params.arguments;

            try {
                const content = await this.mcpService.getResourceContent(uri, args || {});
                return content;
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Resource read failed: ${error}`
                );
            }
        });

        // 设置提示词调用处理器
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const promptName = request.params.name;
            const args = request.params.arguments;

            try {
                if (this.mcpService.canHandlePrompt(promptName)) {
                    const result = await this.mcpService.handlePrompt(promptName, args);
                    return result;
                }

                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown prompt: ${promptName}`
                );
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Prompt execution failed: ${error}`
                );
            }
        });
    }

    public async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        Log.info('MCP服务器已启动');
    }

    public stop(): void {
        this.server.close();
    }
} 