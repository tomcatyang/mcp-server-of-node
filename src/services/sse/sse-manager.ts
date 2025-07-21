import SSEConnectHandler from './sse-connect-handler';
import SSEMessageHandler from './sse-message-handler';

/**
 * 客户端信息接口
 */
export interface ClientInfo {
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
    connectedDuration: number;
    mcp: {
        initialized: boolean;
        protocolVersion: string | null;
        clientInfo: any | null;
    };
}

/**
 * 客户端列表响应接口
 */
export interface ClientsListResponse {
    success: boolean;
    timestamp: number;
    clients: ClientInfo[];
    summary: {
        total: number;
        mcpInitialized: number;
    };
}

/**
 * SSE管理器
 * 负责客户端列表、统计信息等管理功能
 */
class SSEManager {
    private sseConnectHandler: SSEConnectHandler;
    private sseMessageHandler: SSEMessageHandler;

    constructor(sseConnectHandler: SSEConnectHandler, sseMessageHandler: SSEMessageHandler) {
        this.sseConnectHandler = sseConnectHandler;
        this.sseMessageHandler = sseMessageHandler;
    }

    /**
     * 获取所有已连接的客户端信息
     */
    public getClientsList(): ClientsListResponse {
        try {
            const activeSessions = this.sseConnectHandler.getSessionManager().getActiveSessions();
            const mcpProcessor = this.sseMessageHandler.getMCPProcessor();
            
            const clients: ClientInfo[] = activeSessions.map(session => {
                const mcpState = mcpProcessor.getSessionState(session.id);
                return {
                    sessionId: session.id,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    isActive: session.isActive,
                    connectedDuration: Date.now() - session.createdAt,
                    mcp: {
                        initialized: mcpState?.initialized || false,
                        protocolVersion: mcpState?.protocolVersion || null,
                        clientInfo: mcpState?.clientInfo || null
                    }
                };
            });

            const summary = {
                total: clients.length,
                mcpInitialized: clients.filter(c => c.mcp.initialized).length
            };

            return {
                success: true,
                timestamp: Date.now(),
                clients,
                summary
            };

        } catch (error) {
            console.error('❌ 获取客户端列表失败:', error);
            return {
                success: false,
                timestamp: Date.now(),
                clients: [],
                summary: {
                    total: 0,
                    mcpInitialized: 0
                }
            };
        }
    }

    /**
     * 获取服务器统计信息
     */
    public getServerStats() {
        const mcpStats = this.sseMessageHandler.getMCPProcessor().getSessionStats();
        const activeConnections = this.sseConnectHandler.getActiveConnectionCount();
        
        return {
            activeConnections,
            mcpSessions: mcpStats,
            timestamp: Date.now()
        };
    }

    /**
     * 获取特定客户端信息
     */
    public getClientInfo(sessionId: string): ClientInfo | null {
        try {
            const sessionManager = this.sseConnectHandler.getSessionManager();
            const session = sessionManager.getSession(sessionId);
            
            if (!session || !session.isActive) {
                return null;
            }

            const mcpProcessor = this.sseMessageHandler.getMCPProcessor();
            const mcpState = mcpProcessor.getSessionState(sessionId);

            return {
                sessionId: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                isActive: session.isActive,
                connectedDuration: Date.now() - session.createdAt,
                mcp: {
                    initialized: mcpState?.initialized || false,
                    protocolVersion: mcpState?.protocolVersion || null,
                    clientInfo: mcpState?.clientInfo || null
                }
            };

        } catch (error) {
            console.error(`❌ 获取客户端信息失败 [${sessionId}]:`, error);
            return null;
        }
    }

    /**
     * 强制断开客户端连接
     */
    public disconnectClient(sessionId: string): boolean {
        try {
            const sessionManager = this.sseConnectHandler.getSessionManager();
            const removed = sessionManager.removeSession(sessionId);
            
            if (removed) {
                console.log(`🔌 强制断开客户端连接: ${sessionId}`);
                return true;
            } else {
                console.log(`⚠️ 客户端连接不存在或已断开: ${sessionId}`);
                return false;
            }

        } catch (error) {
            console.error(`❌ 断开客户端连接失败 [${sessionId}]:`, error);
            return false;
        }
    }

    /**
     * 向指定客户端发送消息
     */
    public sendMessageToClient(sessionId: string, event: string, data: any): boolean {
        try {
            return this.sseConnectHandler.sendEventToSession(sessionId, event, data);
        } catch (error) {
            console.error(`❌ 向客户端发送消息失败 [${sessionId}]:`, error);
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
            console.error('❌ 广播消息失败:', error);
            return 0;
        }
    }

    /**
     * 获取客户端连接统计
     */
    public getConnectionStats() {
        const clientsList = this.getClientsList();
        const clients = clientsList.clients;
        
        // 按连接时长分组
        const now = Date.now();
        const stats = {
            total: clients.length,
            byDuration: {
                lessThan1min: 0,
                lessThan5min: 0,
                lessThan1hour: 0,
                moreThan1hour: 0
            },
            byMCPStatus: {
                initialized: 0,
                notInitialized: 0
            },
            averageConnectionTime: 0
        };

        let totalConnectionTime = 0;

        clients.forEach(client => {
            const duration = client.connectedDuration;
            totalConnectionTime += duration;

            // 按时长分组
            if (duration < 60 * 1000) {
                stats.byDuration.lessThan1min++;
            } else if (duration < 5 * 60 * 1000) {
                stats.byDuration.lessThan5min++;
            } else if (duration < 60 * 60 * 1000) {
                stats.byDuration.lessThan1hour++;
            } else {
                stats.byDuration.moreThan1hour++;
            }

            // 按MCP状态分组
            if (client.mcp.initialized) {
                stats.byMCPStatus.initialized++;
            } else {
                stats.byMCPStatus.notInitialized++;
            }
        });

        // 计算平均连接时间
        if (clients.length > 0) {
            stats.averageConnectionTime = totalConnectionTime / clients.length;
        }

        return stats;
    }
}

export default SSEManager; 