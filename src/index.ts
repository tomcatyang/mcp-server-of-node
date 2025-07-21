#!/usr/bin/env node
// CLI模式的导入
import { MCPServer } from './mcp-server';
import { SSEServer } from './sse-server';
import toolService from './services/tools/tool-service';
import sampleTools from './sample/sample-tool';

/**
 * MCP Server of Node 主入口
 * 
 * 支持多种运行模式：
 * 1. MCP模式：通过stdio与Claude Desktop等MCP客户端通信
 * 2. SSE模式：作为独立的HTTP SSE服务器运行
 */

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0];

    if (mode === 'sse' || mode === '--sse') {
        // SSE独立服务器模式
        await startSSEMode(args);
    } else if (mode === 'mcp' || mode === '--mcp') {
        // MCP服务器模式（支持不同配置）
        await startMCPMode(args);
    } else {
        // 默认模式：MCP + SSE管理工具
        showHelp();
    }
}   

/**
 * 启动MCP服务器模式
 * 支持不同的SSE配置选项
 */
async function startMCPMode(args: string[]): Promise<void> {
    console.error('🚀 启动MCP Server of Node...');

    const mcpServer = new MCPServer();

    // 设置优雅关闭
    setupGracefulShutdown(() => {
        mcpServer.stop();
    });

    try {
        await mcpServer.start();
    } catch (error) {
        console.error('❌ 启动MCP服务器失败:', error);
        process.exit(1);
    }
}


/**
 * 启动SSE独立服务器模式
 * 用于提供HTTP SSE实时数据推送服务
 */
async function startSSEMode(args: string[]): Promise<void> {
    console.log('🌐 启动SSE独立服务器模式...');

    // 解析端口参数
    let port = 3000;
    const portIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
    if (portIndex !== -1 && args[portIndex + 1]) {
        const parsedPort = parseInt(args[portIndex + 1], 10);
        if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
            port = parsedPort;
        } else {
            console.error('❌ 无效的端口号，使用默认端口 3000');
        }
    }

    const sseServer = new SSEServer(port);

    // 设置优雅关闭
    setupGracefulShutdown(() => {
        sseServer.stop();
    });

    try {
        await sseServer.start();
    } catch (error) {
        console.error('❌ 启动SSE服务器失败:', error);
        process.exit(1);
    }
}

/**
 * 设置优雅关闭处理
 */
function setupGracefulShutdown(cleanup: () => void): void {
    process.on('SIGINT', () => {
        console.error('\n📡 接收到SIGINT信号，正在关闭服务器...');
        cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.error('\n📡 接收到SIGTERM信号，正在关闭服务器...');
        cleanup();
        process.exit(0);
    });

    process.on('uncaughtException', (error) => {
        console.error('❌ 未捕获的异常:', error);
        cleanup();
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('❌ 未处理的Promise拒绝:', reason);
        cleanup();
        process.exit(1);
    });
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
    console.log(`
MCP Server of Node

用法:
  npx mcp-server-of-node                  # 显示此帮助信息（默认）
  npx mcp-server-of-node mcp              # 启动MCP服务器模式
  npx mcp-server-of-node sse [选项]       # 启动SSE独立服务器模式

模式说明:
  mcp                         # 启动标准MCP协议服务器，用于与AI客户端通信
  sse                         # 启动HTTP SSE服务器，提供Web界面和实时推送

SSE模式选项:
  --port, -p <number>        # 指定SSE服务器端口（默认：3000）

通用选项:
  --help, -h                 # 显示此帮助信息

示例:
  # 显示帮助信息
  npx mcp-server-of-node
  npx mcp-server-of-node --help

  # 启动MCP服务器
  npx mcp-server-of-node mcp

  # 启动SSE服务器（默认端口3000）
  npx mcp-server-of-node sse

  # 启动SSE服务器（指定端口）
  npx mcp-server-of-node sse --port 8080
  npx mcp-server-of-node sse -p 8080

工具说明:
  本框架包含示例工具 'show_weather'，可查询天气信息
  开发者可参考 src/sample/sample-tool.ts 创建自定义工具

配置说明:
  MCP模式 - 通过stdio与Claude Desktop等AI客户端通信
  SSE模式 - 作为HTTP服务器运行，支持Web界面和实时推送
`);
}

// 核心模块导出 - 供其他项目使用
export { MCPServer } from './mcp-server';
export { SSEServer } from './sse-server';
export { default as toolService } from './services/tools/tool-service';
export * from './services/tools/tool-type';


// CLI功能导出
export default {
    main,
    showHelp
}

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}

// 启动服务器，添加例子工具
if (require.main === module) {
    // 添加工具
    toolService.addTools(sampleTools);
    // 启动服务器
    main().catch((error) => {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    });
} 