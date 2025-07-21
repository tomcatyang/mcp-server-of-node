import { Request, Response } from 'express';
import { SSEServer } from '../../sse-server';
import SSEConnectHandler from './sse-connect-handler';
import MCPMessageProcessor from './mcp-message-processor';

/**
 * MCP消息接口
 */
export interface MCPMessage {
    jsonrpc: string;
    id?: number | string;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
}

class SSEMessageHandler {
    private sseServer: SSEServer;
    private sseConnectHandler: SSEConnectHandler;
    private mcpProcessor: MCPMessageProcessor;

    constructor(sseServer: SSEServer, sseConnectHandler: SSEConnectHandler) {
        this.sseServer = sseServer;
        this.sseConnectHandler = sseConnectHandler;
        this.mcpProcessor = new MCPMessageProcessor(sseServer, sseConnectHandler);
    }

    /**
     * 处理POST请求到/messages端点
     * 主要处理MCP协议消息
     */
    public onPostMessage(req: Request, res: Response): void {
        try {
            const sessionId = req.query.session_id as string;
            
            if (!sessionId) {
                res.status(400).json({
                    error: 'Missing session_id parameter',
                    message: '缺少session_id参数'
                });
                return;
            }

            // 验证会话是否存在
            const sessionManager = this.sseConnectHandler.getSessionManager();
            const session = sessionManager.getSession(sessionId);
            
            if (!session) {
                res.status(404).json({
                    error: 'Session not found',
                    message: '会话未找到或已失效'
                });
                return;
            }

            // 处理MCP消息
            this.processMCPMessage(sessionId, req.body, res);

        } catch (error) {
            console.error('❌ 处理POST消息请求失败:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: '服务器内部错误'
            });
        }
    }

    public onSessionRemoved(sessionId: string): void {
        this.mcpProcessor.cleanupSession(sessionId);
        console.log(`🔄 会话已移除 [${sessionId}]`);
    }

    /**
     * 处理MCP协议消息
     */
    private async processMCPMessage(sessionId: string, message: any, res: Response): Promise<void> {
        try {
            // 验证JSON-RPC格式
            if (!this.isValidMCPMessage(message)) {
                res.status(400).json({
                    jsonrpc: "2.0",
                    id: message.id || null,
                    error: {
                        code: -32600,
                        message: "Invalid Request",
                        data: "消息不符合JSON-RPC 2.0格式"
                    }
                });
                return;
            }

            console.log(`📥 收到MCP消息 [${sessionId}]:`, {
                method: message.method,
                id: message.id,
                hasParams: !!message.params
            });

            // 处理消息并获取响应
            const response = await this.mcpProcessor.processMessage(sessionId, message);
            
            if (response) {
                // 有响应的消息（如initialize），直接返回HTTP响应
                res.json(response);
                
                // 同时通过SSE发送给客户端
                this.sseConnectHandler.sendEventToSession(sessionId, 'message', response);
                
                console.log(`📤 发送MCP响应 [${sessionId}]:`, {
                    id: response.id,
                    hasResult: !!response.result,
                    hasError: !!response.error
                });
            } else {
                // 无响应的消息（如notifications），只返回成功状态
                res.json({
                    success: true,
                    message: '通知已处理'
                });
                
                console.log(`✅ 处理MCP通知 [${sessionId}]: ${message.method}`);
            }

        } catch (error) {
            console.error(`❌ 处理MCP消息失败 [${sessionId}]:`, error);
            
            const errorResponse = {
                jsonrpc: "2.0",
                id: message.id || null,
                error: {
                    code: -32603,
                    message: "Internal error",
                    data: error instanceof Error ? error.message : '内部服务器错误'
                }
            };
            
            res.status(500).json(errorResponse);
            this.sseConnectHandler.sendEventToSession(sessionId, 'message', errorResponse);
        }
    }

    /**
     * 验证是否为有效的MCP消息
     */
    private isValidMCPMessage(message: any): message is MCPMessage {
        console.log('🔍 验证MCP消息:', 'message ', message);
        return (
            message &&
            typeof message === 'object' &&
            message.jsonrpc === "2.0" &&
            (
                // 请求消息
                (typeof message.method === 'string' && message.method.length > 0) ||
                // 响应消息
                (message.hasOwnProperty('result') || message.hasOwnProperty('error'))
            )
        );
    }

    /**
     * 发送消息到指定会话（程序化接口）
     */
    public sendMessage(sessionId: string, event: string, data: any): boolean {
        return this.sseConnectHandler.sendEventToSession(sessionId, event, data);
    }

    /**
     * 广播消息到所有会话（程序化接口）
     */
    public broadcastMessage(event: string, data: any): number {
        return this.sseConnectHandler.broadcastEvent(event, data);
    }

    /**
     * 获取MCP处理器实例
     */
    public getMCPProcessor(): MCPMessageProcessor {
        return this.mcpProcessor;
    }
}

export default SSEMessageHandler;

