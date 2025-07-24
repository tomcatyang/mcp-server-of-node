import { Request, Response } from 'express';
import SSEManager from '../sse-manager';
import { Log } from '../../../log';

/**
 * 客户端API控制器
 * 提供RESTful API来管理SSE客户端连接
 */
class ClientsApiController {
    private sseManager: SSEManager;

    constructor(sseManager: SSEManager) {
        this.sseManager = sseManager;
    }

    /**
     * 获取所有客户端列表
     * GET /api/clients
     */
    public getClients = async (req: Request, res: Response): Promise<void> => {
        try {
            const clients = this.sseManager.getClients();
            res.json({
                success: true,
                data: clients,
                timestamp: Date.now()
            });
        } catch (error) {
            Log.error('❌ 获取客户端列表API失败:', error);
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
    public getClient = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            const client = this.sseManager.getClient(sessionId);
            
            if (!client) {
                res.status(404).json({
                    success: false,
                    error: 'Client not found',
                    message: '客户端未找到'
                });
                return;
            }

            res.json({
                success: true,
                data: client,
                timestamp: Date.now()
            });
        } catch (error) {
            Log.error('❌ 获取客户端信息API失败:', error);
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
    public disconnectClient = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            const result = this.sseManager.disconnectClient(sessionId);
            
            if (result) {
                res.json({
                    success: true,
                    message: '客户端连接已断开',
                    sessionId,
                    timestamp: Date.now()
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Client not found or already disconnected',
                    message: '客户端未找到或已断开连接',
                    sessionId
                });
            }
        } catch (error) {
            Log.error('❌ 断开客户端连接API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to disconnect client',
                message: '断开客户端连接失败'
            });
        }
    };

    /**
     * 向客户端发送消息
     * POST /api/clients/:sessionId/message
     */
    public sendMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;
            const { event, data } = req.body;
            
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing sessionId parameter',
                    message: '缺少sessionId参数'
                });
                return;
            }

            if (!event) {
                res.status(400).json({
                    success: false,
                    error: 'Missing event parameter',
                    message: '缺少event参数'
                });
                return;
            }

            const result = this.sseManager.sendMessageToClient(sessionId, event, data);
            
            if (result) {
                res.json({
                    success: true,
                    message: '消息发送成功',
                    sessionId,
                    event,
                    timestamp: Date.now()
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Client not found or message send failed',
                    message: '客户端未找到或消息发送失败',
                    sessionId
                });
            }
        } catch (error) {
            Log.error('❌ 发送消息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send message',
                message: '发送消息失败'
            });
        }
    };

    /**
     * 广播消息到所有客户端
     * POST /api/clients/broadcast
     */
    public broadcastMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { event, data } = req.body;
            
            if (!event) {
                res.status(400).json({
                    success: false,
                    error: 'Missing event parameter',
                    message: '缺少event参数'
                });
                return;
            }

            const sentCount = this.sseManager.broadcastMessage(event, data);
            
            res.json({
                success: true,
                message: '广播消息发送完成',
                sentCount,
                event,
                timestamp: Date.now()
            });
        } catch (error) {
            Log.error('❌ 广播消息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast message',
                message: '广播消息失败'
            });
        }
    };

    /**
     * 获取客户端统计信息
     * GET /api/clients/stats
     */
    public getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = this.sseManager.getServerStats();
            res.json({
                success: true,
                data: stats,
                timestamp: Date.now()
            });
        } catch (error) {
            Log.error('❌ 获取客户端统计信息API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get client stats',
                message: '获取统计信息失败'
            });
        }
    };

    /**
     * 批量操作客户端
     * POST /api/clients/batch
     */
    public batchOperation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { operation, sessionIds } = req.body;
            
            if (!operation || !Array.isArray(sessionIds)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid parameters',
                    message: '无效的参数，需要operation和sessionIds数组'
                });
                return;
            }

            const results: any[] = [];
            
            switch (operation) {
                case 'disconnect':
                    for (const sessionId of sessionIds) {
                        const result = this.sseManager.disconnectClient(sessionId);
                        results.push({ sessionId, success: result });
                    }
                    break;
                    
                default:
                    res.status(400).json({
                        success: false,
                        error: 'Unsupported operation',
                        message: '不支持的操作类型'
                    });
                    return;
            }

            res.json({
                success: true,
                operation,
                results,
                timestamp: Date.now()
            });
            
        } catch (error) {
            Log.error('❌ 批量操作API失败:', error);
            res.status(500).json({
                success: false,
                error: 'Batch operation failed',
                message: '批量操作失败'
            });
        }
    };
}

export default ClientsApiController; 