#!/usr/bin/env node

import { MCPServer } from './mcp-server';
import { SSEServer } from './sse-server';

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
    } else {
        // MCP服务器模式（支持不同配置）
        await startMCPMode(args);
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
TAPD MCP Server

用法:
  npx tapd-mcp [选项]                     # 启动MCP服务器模式（默认）
  npx tapd-mcp sse [选项]                 # 启动SSE独立服务器模式

MCP模式选项:
  --no-sse                    # 完全禁用SSE功能，只提供TAPD工具
  --auto-sse [--port PORT]    # 自动启动SSE服务器，不提供SSE管理工具
  --sse-tools-only           # 只提供SSE管理工具，不自动启动
  (默认)                      # 提供TAPD工具 + SSE管理工具

SSE模式选项:
  --port, -p <number>        # 指定SSE服务器端口（默认：3000）

通用选项:
  --help, -h                 # 显示此帮助信息

示例:
  # 纯TAPD模式（无SSE功能）
  npx tapd-mcp --no-sse

  # MCP + 自动SSE模式
  npx tapd-mcp --auto-sse --port 8080

  # MCP + SSE管理工具模式（默认）
  npx tapd-mcp

  # SSE独立服务器模式
  npx tapd-mcp sse
  npx tapd-mcp sse --port 8080

模式说明:
  纯TAPD模式       - 只提供TAPD工具，无SSE功能，最轻量
  MCP+自动SSE模式  - MCP工具 + 自动启动的SSE服务器，无需手动管理
  MCP+SSE工具模式  - MCP工具 + SSE管理工具，可通过Claude手动控制SSE
  SSE独立模式      - 纯HTTP SSE服务器，提供Web界面和实时推送
`);
}


export default {
    main,
    showHelp
}