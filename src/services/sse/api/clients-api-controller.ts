import { Request, Response } from 'express';
import SSEManager from '../sse-manager';

/**
 * 客户端API控制器
 * 负责处理所有与客户端管理相关的API接口
 */
export class ClientsApiController {
    private sseManager: SSEManager;

    constructor(sseManager: SSEManager) {
        this.sseManager = sseManager;
    }

    /**
     * 获取所有已连接客户端列表
     * GET /api/clients
     */
    public getClientsList = (req: Request, res: Response): void => {
        try {
            const clientsList = this.sseManager.getClientsList();
            res.json(clientsList);
        } catch (error) {
            console.error('❌ 获取客户端列表API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get clients list',
                message: '获取客户端列表失败'
            });
        }
    };

    /**
     * 获取特定客户端信息
     * GET /api/clients/:sessionId
     */
    public getClientInfo = (req: Request, res: Response): void => {
        try {
            const sessionId = req.params.sessionId;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            const clientInfo = this.sseManager.getClientInfo(sessionId);
            
            if (clientInfo) {
                res.json({
                    success: true,
                    client: clientInfo
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Client not found',
                    message: '客户端未找到'
                });
            }
        } catch (error) {
            console.error('❌ 获取客户端信息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get client info',
                message: '获取客户端信息失败'
            });
        }
    };

    /**
     * 断开客户端连接
     * DELETE /api/clients/:sessionId
     */
    public disconnectClient = (req: Request, res: Response): void => {
        try {
            const sessionId = req.params.sessionId;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            const success = this.sseManager.disconnectClient(sessionId);
            
            res.json({
                success,
                sessionId,
                message: success ? '客户端连接已断开' : '客户端连接不存在或已断开'
            });
        } catch (error) {
            console.error('❌ 断开客户端连接API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to disconnect client',
                message: '断开客户端连接失败'
            });
        }
    };

    /**
     * 向指定客户端发送消息
     * POST /api/clients/:sessionId/messages
     */
    public sendMessageToClient = (req: Request, res: Response): void => {
        try {
            const sessionId = req.params.sessionId;
            const { event = 'message', data } = req.body;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            if (!data) {
                res.status(400).json({
                    success: false,
                    error: 'Missing data field',
                    message: '缺少data字段'
                });
                return;
            }
            
            const success = this.sseManager.sendMessageToClient(sessionId, event, data);
            
            res.json({
                success,
                sessionId,
                event,
                message: success ? '消息发送成功' : '消息发送失败，客户端可能已断开'
            });
        } catch (error) {
            console.error('❌ 发送消息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send message',
                message: '发送消息失败'
            });
        }
    };

    /**
     * 广播消息到所有客户端
     * POST /api/broadcast
     */
    public broadcastMessage = (req: Request, res: Response): void => {
        try {
            const { event = 'message', data } = req.body;
            
            if (!data) {
                res.status(400).json({
                    success: false,
                    error: 'Missing data field',
                    message: '缺少data字段'
                });
                return;
            }
            
            const sentCount = this.sseManager.broadcastMessage(event, data);
            
            res.json({
                success: true,
                event,
                sentCount,
                message: `消息已广播到${sentCount}个客户端`
            });
        } catch (error) {
            console.error('❌ 广播消息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast message',
                message: '广播消息失败'
            });
        }
    };

    /**
     * 获取客户端连接统计信息
     * GET /api/clients/stats
     */
    public getClientsStats = (req: Request, res: Response): void => {
        try {
            const connectionStats = this.sseManager.getConnectionStats();
            const serverStats = this.sseManager.getServerStats();
            
            res.json({
                success: true,
                timestamp: Date.now(),
                connectionStats,
                serverStats
            });
        } catch (error) {
            console.error('❌ 获取客户端统计信息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get clients stats',
                message: '获取客户端统计信息失败'
            });
        }
    };

    /**
     * 批量操作客户端
     * POST /api/clients/batch
     */
    public batchOperations = (req: Request, res: Response): void => {
        try {
            const { operation, sessionIds, data } = req.body;
            
            if (!operation || !Array.isArray(sessionIds)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    message: '请求体格式错误，需要operation和sessionIds字段'
                });
                return;
            }

            let results: any[] = [];

            switch (operation) {
                case 'disconnect':
                    results = sessionIds.map(sessionId => ({
                        sessionId,
                        success: this.sseManager.disconnectClient(sessionId)
                    }));
                    break;

                case 'sendMessage':
                    if (!data) {
                        res.status(400).json({
                            success: false,
                            error: 'Missing data field for sendMessage operation',
                            message: 'sendMessage操作需要data字段'
                        });
                        return;
                    }
                    results = sessionIds.map(sessionId => ({
                        sessionId,
                        success: this.sseManager.sendMessageToClient(sessionId, data.event || 'message', data.payload)
                    }));
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        error: 'Unsupported operation',
                        message: `不支持的操作: ${operation}`
                    });
                    return;
            }

            const successCount = results.filter(r => r.success).length;
            
            res.json({
                success: true,
                operation,
                total: sessionIds.length,
                successCount,
                results
            });

        } catch (error) {
            console.error('❌ 批量操作API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to perform batch operation',
                message: '批量操作失败'
            });
        }
    };
} 