import { Router } from 'express';
import ClientsApiController from './clients-api-controller';
import SSEManager from '../sse-manager';

/**
 * 客户端API路由
 * 负责定义所有与客户端管理相关的路由
 */
export class ClientsApiRoutes {
    private router: Router;
    private controller: ClientsApiController;

    constructor(sseManager: SSEManager) {
        this.router = Router();
        this.controller = new ClientsApiController(sseManager);
        this.setupRoutes();
    }

    /**
     * 设置所有客户端相关的路由
     */
    private setupRoutes(): void {
        // 客户端列表和统计
        this.router.get('/clients', this.controller.getClients);
        this.router.get('/clients/stats', this.controller.getStats);
        
        // 客户端操作
        this.router.get('/clients/:sessionId', this.controller.getClient);
        this.router.delete('/clients/:sessionId', this.controller.disconnectClient);
        this.router.post('/clients/:sessionId/message', this.controller.sendMessage);
        
        // 批量操作和广播
        this.router.post('/clients/broadcast', this.controller.broadcastMessage);
        this.router.post('/clients/batch', this.controller.batchOperation);
    }

    /**
     * 获取配置好的路由器
     */
    public getRouter(): Router {
        return this.router;
    }

    /**
     * 获取控制器实例（用于测试或其他用途）
     */
    public getController(): ClientsApiController {
        return this.controller;
    }

    /**
     * 获取所有路由信息（用于文档或调试）
     */
    public getRouteInfo(): Array<{ method: string; path: string; description: string }> {
        return [
            {
                method: 'GET',
                path: '/api/clients',
                description: '获取所有已连接客户端列表'
            },
            {
                method: 'GET',
                path: '/api/clients/stats',
                description: '获取客户端连接统计信息'
            },
            {
                method: 'GET',
                path: '/api/clients/:sessionId',
                description: '获取特定客户端信息'
            },
            {
                method: 'DELETE',
                path: '/api/clients/:sessionId',
                description: '断开特定客户端连接'
            },
            {
                method: 'POST',
                path: '/api/clients/:sessionId/messages',
                description: '向特定客户端发送消息'
            },
            {
                method: 'POST',
                path: '/api/clients/batch',
                description: '批量操作客户端（断开连接、发送消息等）'
            },
            {
                method: 'POST',
                path: '/api/broadcast',
                description: '向所有客户端广播消息'
            }
        ];
    }
} 