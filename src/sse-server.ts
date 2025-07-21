import express, { Request, Response } from 'express';
import cors from 'cors';
import SSEConnectHandler from './services/sse/sse-connect-handler';
import SSEMessageHandler from './services/sse/sse-message-handler';
import SSEManager from './services/sse/sse-manager';
import { ClientsApiRoutes } from './services/sse/api/clients-api-routes';

export class SSEServer {
    private app: express.Application;
    private port: number;
    private server: any;
    private sseConnectHandler: SSEConnectHandler;
    private sseMessageHandler: SSEMessageHandler;
    private sseManager: SSEManager;
    private clientsApiRoutes: ClientsApiRoutes;

    constructor(port: number = 3000) {
        this.app = express();
        this.port = port;
        this.setupMiddleware();
        this.sseConnectHandler = new SSEConnectHandler(this);
        this.sseMessageHandler = new SSEMessageHandler(this, this.sseConnectHandler);
        this.sseManager = new SSEManager(this.sseConnectHandler, this.sseMessageHandler);
        this.clientsApiRoutes = new ClientsApiRoutes(this.sseManager);
        
        // 设置会话清理回调，用于清理MCP状态
        this.sseConnectHandler.setSessionRemovedCallback((sessionId: string) => {
            this.sseMessageHandler.onSessionRemoved(sessionId);
        });
        
        this.setupRoutes();
    }

    private setupMiddleware() {
        // 启用CORS
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        // 解析JSON
        this.app.use(express.json());

        // 静态文件服务（如果需要提供测试页面）
        this.app.use(express.static('public'));
    }

    private setupRoutes() {
        // SSE连接端点
        this.app.get('/sse', (req: Request, res: Response) => {
            this.sseConnectHandler.onClientConnect(req, res);
        });

        // 消息端点 - 只支持POST方法
        this.app.post('/messages', (req: Request, res: Response) => {
            this.sseMessageHandler.onPostMessage(req, res);
        });

        // 使用客户端API路由模块
        this.app.use('/api', this.clientsApiRoutes.getRouter());

        // 获取API文档信息
        this.app.get('/api/docs', (req: Request, res: Response) => {
            try {
                const routeInfo = this.clientsApiRoutes.getRouteInfo();
                const serverStats = this.sseManager.getServerStats();
                
                res.json({
                    success: true,
                    service: 'MCP Server of Node API',
                    version: '1.0.0',
                    timestamp: Date.now(),
                    endpoints: routeInfo,
                    serverStatus: serverStats
                });
            } catch (error) {
                console.error('❌ 获取API文档失败:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get API documentation',
                    message: '获取API文档失败'
                });
            }
        });

        // 健康检查端点
        this.app.get('/health', (req: Request, res: Response) => {
            const serverStats = this.sseManager.getServerStats();
            res.json({
                status: 'healthy',
                ...serverStats
            });
        });

        // 根路径提供简单的信息
        this.app.get('/', (req: Request, res: Response) => {
            const serverStats = this.sseManager.getServerStats();
            const routeInfo = this.clientsApiRoutes.getRouteInfo();
            
            res.json({
                service: 'MCP Server of Node',
                version: '1.0.0',
                endpoints: {
                    core: {
                        sse: '/sse',
                        messages: '/messages',
                        health: '/health'
                    },
                    api: routeInfo.reduce((acc, route) => {
                        acc[route.path] = route.method;
                        return acc;
                    }, {} as Record<string, string>),
                    docs: '/api/docs'
                },
                status: serverStats
            });
        });
    }

    public async start() {
        return new Promise<void>((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`🌐 SSE服务器在端口 ${this.port} 上启动`);
                    console.log(`📡 SSE连接端点: http://localhost:${this.port}/sse`);
                    console.log(`💬 消息端点: http://localhost:${this.port}/messages`);
                    console.log(`👥 客户端API: http://localhost:${this.port}/api/clients`);
                    console.log(`📊 API文档: http://localhost:${this.port}/api/docs`);
                    console.log(`🔍 健康检查: http://localhost:${this.port}/health`);
                    console.log(`🚀 MCP over SSE 服务已就绪`);
                    resolve();
                });

                this.server.on('error', (error: Error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async stop() {
        if (this.server) {
            return new Promise<void>((resolve) => {
                this.sseConnectHandler.stop();
                this.server.close(() => {
                    console.log('🛑 SSE服务器已停止');
                    resolve();
                });
            });
        }
    }

    /**
     * 获取客户端API路由实例（用于测试或扩展）
     */
    public getClientsApiRoutes(): ClientsApiRoutes {
        return this.clientsApiRoutes;
    }
} 