import SSEConnectHandler from './sse-connect-handler';
import SSEMessageHandler from './sse-message-handler';
import { Log } from '../../log';

/**
 * SSE服务管理器
 * 统一管理SSE连接、消息处理和客户端操作
 */
class SSEManager {
    private sseConnectHandler: SSEConnectHandler;
    private sseMessageHandler: SSEMessageHandler;

    constructor(sseConnectHandler: SSEConnectHandler, sseMessageHandler: SSEMessageHandler) {
        this.sseConnectHandler = sseConnectHandler;
        this.sseMessageHandler = sseMessageHandler;
    }

    /**
     * 获取所有客户端信息
     */
    public getClients(): any[] {
        try {
            const sessions = this.sseConnectHandler.getSessionManager().getActiveSessions();
            
            return sessions.map(session => ({
                id: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                isActive: session.isActive,
                connectionTime: Date.now() - session.createdAt
            }));
        } catch (error) {
            Log.error('❌ 获取客户端列表失败:', error);
            return [];
        }
    }

    /**
     * 获取指定客户端信息
     */
    public getClient(sessionId: string): any {
        try {
            const session = this.sseConnectHandler.getSessionManager().getSession(sessionId);
            if (!session) {
                return null;
            }

            return {
                id: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                isActive: session.isActive,
                connectionTime: Date.now() - session.createdAt
            };
        } catch (error) {
            Log.error(`❌ 获取客户端信息失败 [${sessionId}]:`, error);
            return null;
        }
    }

    /**
     * 断开客户端连接
     */
    public disconnectClient(sessionId: string): boolean {
        try {
            const result = this.sseConnectHandler.getSessionManager().removeSession(sessionId);
            if (result) {
                Log.info(`🔌 强制断开客户端连接: ${sessionId}`);
            } else {
                Log.warn(`⚠️ 客户端连接不存在或已断开: ${sessionId}`);
            }
            return result;
        } catch (error) {
            Log.error(`❌ 断开客户端连接失败 [${sessionId}]:`, error);
            return false;
        }
    }

    /**
     * 向客户端发送消息
     */
    public sendMessageToClient(sessionId: string, event: string, data: any): boolean {
        try {
            return this.sseConnectHandler.sendEventToSession(sessionId, event, data);
        } catch (error) {
            Log.error(`❌ 向客户端发送消息失败 [${sessionId}]:`, error);
            return false;
        }
    }

    /**
     * 向所有客户端广播消息
     */
    public broadcastMessage(event: string, data: any): number {
        try {
            return this.sseConnectHandler.broadcastEvent(event, data);
        } catch (error) {
            Log.error('❌ 广播消息失败:', error);
            return 0;
        }
    }

    /**
     * 获取服务器统计信息
     */
    public getServerStats(): any {
        const totalConnections = this.sseConnectHandler.getActiveConnectionCount();
        const uptime = process.uptime();
        
        return {
            totalConnections,
            uptime,
            timestamp: Date.now(),
            status: 'running'
        };
    }
}

export default SSEManager; 