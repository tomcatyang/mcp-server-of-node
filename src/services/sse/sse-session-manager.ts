import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Log } from '../../log';

export interface SSESession {
    id: string;
    response: Response;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
}

class SSESessionManager {
    private sessions: Map<string, SSESession> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5分钟超时
    private readonly HEARTBEAT_INTERVAL = 10 * 1000; // 30秒心跳
    private readonly HEARTBEAT_EVENT = 'heartbeat';
    
    // 会话移除事件回调
    public onSessionRemoved?: (sessionId: string) => void;

    constructor() {
        this.startHeartbeat();
    }

    /**
     * 创建新的SSE会话
     */
    public createSession(response: Response): SSESession {
        const sessionId = uuidv4().replace(/-/g, '');
        const now = Date.now();
        
        const session: SSESession = {
            id: sessionId,
            response,
            createdAt: now,
            lastActivity: now,
            isActive: true
        };

        this.sessions.set(sessionId, session);
        
        // 设置连接关闭时的清理
        response.on('close', () => {
            this.removeSession(sessionId);
        });

        response.on('error', () => {
            this.removeSession(sessionId);
        });

        Log.info(`✅ 创建SSE会话: ${sessionId}, 当前会话数: ${this.sessions.size}`);
        return session;
    }

    /**
     * 根据ID获取会话
     */
    public getSession(sessionId: string): SSESession | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
        return session;
    }

    /**
     * 移除会话
     */
    public removeSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.isActive = false;
            try {
                if (!session.response.headersSent) {
                    session.response.end();
                }
            } catch (error) {
                // 忽略连接已关闭的错误
            }
            this.sessions.delete(sessionId);
            Log.info(`🗑️ 移除SSE会话: ${sessionId}, 剩余会话数: ${this.sessions.size}`);
            
            // 触发会话移除事件
            if (this.onSessionRemoved) {
                this.onSessionRemoved(sessionId);
            }
            
            return true;
        }
        return false;
    }

    /**
     * 获取所有活跃会话
     */
    public getActiveSessions(): SSESession[] {
        return Array.from(this.sessions.values()).filter(session => session.isActive);
    }

    /**
     * 获取会话数量
     */
    public getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * 写入SSE事件数据到会话
     * @param session 会话对象
     * @param event 事件类型
     * @param data 事件数据
     * @returns 是否写入成功
     */
    private writeSSEEvent(session: SSESession, event: string, data: any): boolean {
        try {
            const eventString = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            // 确保使用UTF-8编码写入数据
            session.response.write(eventString, 'utf8');
            return true;
        } catch (error) {
            Log.error(`❌ 写入SSE事件失败 [${session.id}]:`, error);
            this.removeSession(session.id);
            return false;
        }
    }

    /**
     * 写入原始SSE数据到会话
     * @param session 会话对象
     * @param rawData 原始SSE格式数据
     * @returns 是否写入成功
     */
    private writeSSERawData(session: SSESession, rawData: string): boolean {
        try {
            // 确保使用UTF-8编码写入数据
            session.response.write(rawData, 'utf8');
            return true;
        } catch (error) {
            Log.error(`❌ 写入SSE原始数据失败 [${session.id}]:`, error);
            this.removeSession(session.id);
            return false;
        }
    }

    /**
     * 向指定会话发送数据
     */
    public sendToSession(sessionId: string, event: string, data: any): boolean {
        const session = this.getSession(sessionId);
        if (!session || !session.isActive) {
            return false;
        }

        return this.writeSSEEvent(session, event, data);
    }

    /**
     * 向指定会话发送原始SSE数据
     */
    public sendRawDataToSession(sessionId: string, rawData: string): boolean {
        const session = this.getSession(sessionId);
        if (!session || !session.isActive) {
            return false;
        }

        return this.writeSSERawData(session, rawData);
    }

    /**
     * 向所有会话广播消息
     */
    public broadcast(event: string, data: any, callback?: (sessionId: string, result: boolean) => void): number {
        let successCount = 0;
        const sessions = this.getActiveSessions();
        
        for (const session of sessions) {
            const result = this.writeSSEEvent(session, event, data);
            if (result) {
                successCount++;
            }
            if (callback) {
                callback(session.id, result);
            }
        }
        
        return successCount;
    }

    /**
     * 向所有会话广播原始SSE数据
     */
    public broadcastRawData(rawData: string): number {
        let successCount = 0;
        const sessions = this.getActiveSessions();
        
        for (const session of sessions) {
            if (this.writeSSERawData(session, rawData)) {
                successCount++;
            }
        }
        
        return successCount;
    }

    /**
     * 启动心跳检测
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.cleanupExpiredSessions();
            this.sendHeartbeat();
        }, this.HEARTBEAT_INTERVAL);
    }

    /**
     * 清理过期会话
     */
    private cleanupExpiredSessions(): void {
        // 由于客户端不回回复heartbeat，所以无法判断会话是否超时
        // 因此，这里不清理过期会话
        return;
        const now = Date.now();
        const expiredSessions: string[] = [];

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActivity > this.SESSION_TIMEOUT) {
                expiredSessions.push(sessionId);
            }
        }

        for (const sessionId of expiredSessions) {
            Log.warn(`⏰ 会话超时，移除: ${sessionId}`);
            this.removeSession(sessionId);
        }
    }

    /**
     * 发送心跳到所有会话
     */
    private sendHeartbeat(): void {
        const activeSessions = this.getActiveSessions();
        if (activeSessions.length > 0) {
            this.broadcast(this.HEARTBEAT_EVENT, { timestamp: Date.now() }, (sessionId, result) => {
                if (result) {
                    // Log.debug(`💓 发送心跳到会话: ${sessionId} 成功`);
                } else {
                    Log.warn(`💓 发送心跳到会话: ${sessionId} 失败`);
                }
            });
        }
    }

    /**
     * 停止会话管理器
     */
    public stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // 关闭所有会话
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            this.removeSession(sessionId);
        }

        Log.info('🛑 SSE会话管理器已停止');
    }
}

export default SSESessionManager;