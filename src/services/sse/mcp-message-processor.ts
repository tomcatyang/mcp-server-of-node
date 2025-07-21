import SSEConnectHandler from './sse-connect-handler';
import { MCPMessage } from './sse-message-handler';
import toolService from '../tools/tool-service';  

/**
 * 会话状态接口
 */
interface SessionState {
    initialized: boolean;
    capabilities: any;
    clientInfo?: any;
    protocolVersion?: string;
}

/**
 * MCP协议消息处理器
 * 负责处理不同类型的MCP方法调用
 */
class MCPMessageProcessor {
    private sseConnectHandler: SSEConnectHandler;
    private sessionStates: Map<string, SessionState> = new Map();

    constructor(sseConnectHandler: SSEConnectHandler) {
        this.sseConnectHandler = sseConnectHandler;
    }

    /**
     * 处理MCP消息
     */
    public async processMessage(sessionId: string, message: MCPMessage): Promise<MCPMessage | null> {
        const method = message.method;
        
        if (!method) {
            // 这是一个响应消息，不是请求
            return null;
        }

        // 根据方法名路由到对应的处理器
        switch (method) {
            case 'initialize':
                return await this.handleInitialize(sessionId, message);
                
            case 'notifications/initialized':
                return await this.handleInitialized(sessionId, message);
                
            case 'tools/list':
                return await this.handleToolsList(sessionId, message);
                
            case 'tools/call':
                return await this.handleToolsCall(sessionId, message);
                
            case 'prompts/list':
                return await this.handlePromptsList(sessionId, message);
                
            case 'resources/list':
                return await this.handleResourcesList(sessionId, message);
                
            default:
                return this.createErrorResponse(message.id, -32601, `Method not found: ${method}`);
        }
    }

    /**
     * 处理initialize方法
     */
    private async handleInitialize(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
        try {
            const params = message.params || {};
            const { protocolVersion, capabilities, clientInfo } = params;

            console.log(`🔧 初始化会话 [${sessionId}]:`, {
                protocolVersion,
                clientName: clientInfo?.name,
                clientVersion: clientInfo?.version
            });

            // 保存会话状态
            const sessionState: SessionState = {
                initialized: false, // 需要等待initialized通知
                capabilities: capabilities || {},
                clientInfo,
                protocolVersion
            };
            this.sessionStates.set(sessionId, sessionState);

            // 返回服务器能力
            const response: MCPMessage = {
                jsonrpc: "2.0",
                id: message.id,
                result: {
                    protocolVersion: protocolVersion || "2024-11-05",
                    capabilities: {
                        experimental: {},
                        prompts: {
                            listChanged: false
                        },
                        resources: {
                            subscribe: false,
                            listChanged: false
                        },
                        tools: {
                            listChanged: false
                        }
                    },
                    serverInfo: {
                        name: "tapd-mcp-sse",
                        version: "1.0.0"
                    }
                }
            };

            return response;

        } catch (error) {
            console.error(`❌ 处理initialize失败 [${sessionId}]:`, error);
            return this.createErrorResponse(message.id, -32603, `Initialize failed: ${error}`);
        }
    }

    /**
     * 处理notifications/initialized方法
     */
    private async handleInitialized(sessionId: string, message: MCPMessage): Promise<MCPMessage | null> {
        try {
            const sessionState = this.sessionStates.get(sessionId);
            
            if (!sessionState) {
                console.error(`❌ 会话状态未找到 [${sessionId}]`);
                return null;
            }

            // 标记会话为已初始化
            sessionState.initialized = true;
            this.sessionStates.set(sessionId, sessionState);

            console.log(`✅ 会话初始化完成 [${sessionId}]`);

            // 发送初始化完成事件
            this.sseConnectHandler.sendEventToSession(sessionId, 'initialized', {
                timestamp: Date.now(),
                message: '会话初始化完成，可以开始使用MCP功能'
            });

            // notifications不需要响应
            return null;

        } catch (error) {
            console.error(`❌ 处理initialized通知失败 [${sessionId}]:`, error);
            return null;
        }
    }

    /**
     * 处理tools/list方法
     */
    private async handleToolsList(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
        // 检查会话是否已初始化
        if (!this.isSessionInitialized(sessionId)) {
            return this.createErrorResponse(message.id, -32002, "Session not initialized");
        }

        return {
            jsonrpc: "2.0",
            id: message.id,
            result: {
                tools: toolService.getToolList()
            }
        };
    }

    /**
     * 处理tools/call方法
     */
    private async handleToolsCall(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
        // 检查会话是否已初始化
        if (!this.isSessionInitialized(sessionId)) {
            return this.createErrorResponse(message.id, -32002, "Session not initialized");
        }

        const params = message.params || {};
        const { name, arguments: args } = params;

        console.log(`🔧 调用工具 [${sessionId}]: ${name}`, args);

        const tool = toolService.getTool(name);

        if (!tool) {
            return this.createErrorResponse(message.id, -32601, `Tool not found: ${name}`);
        }

        const result = await tool.handle(args);

        console.log(`🔧 工具执行结果 [${sessionId}]:`, result);

        if (!result) {
            return this.createErrorResponse(message.id, -32600, `Tool result not found: ${name}`);
        }

        // 这里可以集成实际的TAPD工具逻辑
        // 暂时返回模拟响应
        return {
            jsonrpc: "2.0",
            id: message.id,
            result
        };
    }

    /**
     * 处理prompts/list方法
     */
    private async handlePromptsList(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
        if (!this.isSessionInitialized(sessionId)) {
            return this.createErrorResponse(message.id, -32002, "Session not initialized");
        }

        return {
            jsonrpc: "2.0",
            id: message.id,
            result: {
                prompts: []
            }
        };
    }

    /**
     * 处理resources/list方法
     */
    private async handleResourcesList(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
        if (!this.isSessionInitialized(sessionId)) {
            return this.createErrorResponse(message.id, -32002, "Session not initialized");
        }

        return {
            jsonrpc: "2.0",
            id: message.id,
            result: {
                resources: []
            }
        };
    }

    /**
     * 检查会话是否已初始化
     */
    private isSessionInitialized(sessionId: string): boolean {
        const sessionState = this.sessionStates.get(sessionId);
        return sessionState?.initialized === true;
    }

    /**
     * 创建错误响应
     */
    private createErrorResponse(id: any, code: number, message: string): MCPMessage {
        return {
            jsonrpc: "2.0",
            id: id || null,
            error: {
                code,
                message,
                data: null
            }
        };
    }

    /**
     * 获取会话状态
     */
    public getSessionState(sessionId: string): SessionState | undefined {
        return this.sessionStates.get(sessionId);
    }

    /**
     * 清理会话状态
     */
    public cleanupSession(sessionId: string): void {
        this.sessionStates.delete(sessionId);
        console.log(`🗑️ 清理会话状态: ${sessionId}`);
    }

    /**
     * 获取所有活跃会话的统计信息
     */
    public getSessionStats(): { total: number; initialized: number } {
        const total = this.sessionStates.size;
        const initialized = Array.from(this.sessionStates.values())
            .filter(state => state.initialized).length;
        
        return { total, initialized };
    }
}

export default MCPMessageProcessor; 