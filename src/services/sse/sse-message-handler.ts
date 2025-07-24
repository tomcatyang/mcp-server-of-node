import { Request, Response } from 'express';
import { SSEServer } from '../../sse-server';
import SSEConnectHandler from './sse-connect-handler';
import MCPMessageProcessor from './mcp-message-processor';
import { Log } from '../../log';

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
    private mcpMessageProcessor: MCPMessageProcessor;

    constructor(sseServer: SSEServer, sseConnectHandler: SSEConnectHandler) {
        this.sseServer = sseServer;
        this.sseConnectHandler = sseConnectHandler;
        this.mcpMessageProcessor = new MCPMessageProcessor(sseServer, sseConnectHandler);
    }

    /**
     * 处理POST消息请求
     */
    public async onPostMessage(req: Request, res: Response): Promise<void> {
        try {
            const sessionId = req.query.session_id as string;
            const message = req.body;

            if (!sessionId) {
                res.status(400).json({
                    error: 'Missing session_id parameter'
                });
                return;
            }

            // 验证会话是否存在
            const session = this.sseConnectHandler.getSessionManager().getSession(sessionId);
            if (!session) {
                res.status(404).json({
                    error: 'Session not found'
                });
                return;
            }

            // 立即响应客户端，确认消息已收到
            res.status(200).json({
                status: 'received',
                sessionId,
                timestamp: Date.now()
            });

            // 处理MCP消息（异步处理）
            setImmediate(async () => {
                await this.processMCPMessage(sessionId, message);
            });

        } catch (error) {
            Log.error('❌ 处理POST消息请求失败:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: '处理消息请求失败'
            });
        }
    }

    /**
     * 会话移除回调
     */
    public onSessionRemoved(sessionId: string): void {
        Log.info(`🔄 会话已移除 [${sessionId}]`);
        // 清理MCP状态
        this.mcpMessageProcessor.cleanupSession(sessionId);
    }

    /**
     * 处理MCP消息
     */
    private async processMCPMessage(sessionId: string, message: any): Promise<void> {
        try {
            // 验证基本的MCP消息格式
            if (!this.isValidMCPMessage(message)) {
                Log.warn('❌ 无效的MCP消息格式:', message);
                return;
            }

            Log.debug(`📥 收到MCP消息 [${sessionId}]:`, {
                id: message.id,
                method: message.method,
                // 不打印完整参数以避免日志过长
                hasParams: !!message.params
            });

            // 使用MCP处理器处理消息
            const response = await this.mcpMessageProcessor.processMessage(sessionId, message);
            
            if (response) {
                // 通过SSE发送响应
                this.sseConnectHandler.sendEventToSession(sessionId, 'message', response);
                
                Log.debug(`📤 发送MCP响应 [${sessionId}]:`, {
                    id: response.id,
                    hasResult: !!response.result,
                    hasError: !!response.error
                });
            } else {
                // 处理通知消息（无需响应）
                Log.debug(`✅ 处理MCP通知 [${sessionId}]: ${message.method}`);
            }

        } catch (error) {
            Log.error(`❌ 处理MCP消息失败 [${sessionId}]:`, error);
            
            // 发送错误响应
            const errorResponse = {
                jsonrpc: '2.0',
                id: message.id || null,
                error: {
                    code: -32603,
                    message: '内部服务器错误'
                }
            };
            
            this.sseConnectHandler.sendEventToSession(sessionId, 'message', errorResponse);
        }
    }

    /**
     * 验证MCP消息格式
     */
    private isValidMCPMessage(message: any): boolean {
        Log.debug('🔍 验证MCP消息:', { message });
        
        // 基本的JSON-RPC 2.0格式检查
        return message &&
               typeof message === 'object' &&
               message.jsonrpc === '2.0' &&
               (typeof message.method === 'string' || typeof message.id !== 'undefined');
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
        return this.mcpMessageProcessor;
    }
}

export default SSEMessageHandler;

