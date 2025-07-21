import { Request, Response } from 'express';
import { SSEServer } from '../../sse-server';
import SSESessionManager, { SSESession } from './sse-session-manager';

export interface SSEClient {
    id: string;
    response: Response;
    lastHeartbeat: number;
}

class SSEConnectHandler {
    private sseServer: SSEServer;
    private sessionManager: SSESessionManager;

    constructor(sseServer: SSEServer) {
        this.sseServer = sseServer;
        this.sessionManager = new SSESessionManager();
        
        // 监听会话清理事件，用于清理MCP状态
        this.sessionManager.onSessionRemoved = (sessionId: string) => {
            this.notifyMCPProcessorSessionRemoved(sessionId);
        };
    }

    /**
     * 处理客户端SSE连接请求
     */
    public async onClientConnect(req: Request, res: Response): Promise<void> {
        try {
            console.log('🔌 新的SSE连接请求, client ip', req.ip);

            // 设置SSE响应头，包含UTF-8编码
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

            // 保持连接不超时
            res.setTimeout(0);

            // 创建新会话
            const session = this.sessionManager.createSession(res);

            // 发送初始的endpoint事件
            this.sendEndpointEvent(session);

            // 发送欢迎消息
            this.sendWelcomeMessage(session);

            console.log(`🌐 SSE连接已建立，会话ID: ${session.id}`);

        } catch (error) {
            console.error('❌ 处理SSE连接失败:', error);
            if (!res.headersSent) {
                res.status(500).end();
            }
        }
    }

    /**
     * 发送endpoint事件，告知客户端消息端点
     */
    private sendEndpointEvent(session: SSESession): void {
        const messageEndpoint = `/messages?session_id=${session.id}`;
        
        try {
            // 使用会话管理器的原始数据写入方法
            const eventString = `event: endpoint\ndata: ${messageEndpoint}\n\n`;
            const success = this.sessionManager.sendRawDataToSession(session.id, eventString);
            
            if (success) {
                console.log(`📍 发送endpoint事件: ${messageEndpoint}`);
            }
        } catch (error) {
            console.error('❌ 发送endpoint事件失败:', error);
            this.sessionManager.removeSession(session.id);
        }
    }

    /**
     * 发送欢迎消息
     */
    private sendWelcomeMessage(session: SSESession): void {
        const welcomeData = {
            type: 'welcome',
            sessionId: session.id,
            timestamp: Date.now(),
            message: 'SSE连接已建立，可以开始MCP通信'
        };

        try {
            // 使用会话管理器的事件写入方法
            const success = this.sessionManager.sendToSession(session.id, 'welcome', welcomeData);
            
            if (success) {
                console.log(`👋 发送欢迎消息到会话: ${session.id}`);
            }
        } catch (error) {
            console.error('❌ 发送欢迎消息失败:', error);
            this.sessionManager.removeSession(session.id);
        }
    }

    /**
     * 通知MCP处理器会话已移除
     */
    private notifyMCPProcessorSessionRemoved(sessionId: string): void {
        // 这个方法会在SSE服务器初始化后设置
        // 避免循环依赖，通过回调方式处理
        if (this.onSessionRemovedCallback) {
            this.onSessionRemovedCallback(sessionId);
        }
    }

    private onSessionRemovedCallback?: (sessionId: string) => void;

    /**
     * 设置会话移除回调
     */
    public setSessionRemovedCallback(callback: (sessionId: string) => void): void {
        this.onSessionRemovedCallback = callback;
    }

    /**
     * 获取会话管理器
     */
    public getSessionManager(): SSESessionManager {
        return this.sessionManager;
    }

    /**
     * 向指定会话发送事件
     */
    public sendEventToSession(sessionId: string, event: string, data: any): boolean {
        console.log(`📤 发送事件到会话: ${sessionId}, 事件: ${event}, 数据:`, data);
        return this.sessionManager.sendToSession(sessionId, event, data);
    }

    /**
     * 向所有会话广播事件
     */
    public broadcastEvent(event: string, data: any): number {
        return this.sessionManager.broadcast(event, data);
    }

    /**
     * 获取活跃连接数
     */
    public getActiveConnectionCount(): number {
        return this.sessionManager.getSessionCount();
    }

    /**
     * 停止连接处理器
     */
    public stop(): void {
        this.sessionManager.stop();
        console.log('🛑 SSE连接处理器已停止');
    }
}

export default SSEConnectHandler;