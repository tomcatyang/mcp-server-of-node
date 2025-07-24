#!/usr/bin/env node

/**
 * Log模块测试
 * 运行命令：npx tsx src/log/test-logger.ts
 */

import { Log, LogLevel } from './index';

console.log('\n=== 简化Log模块测试 ===\n');

// 1. 基本日志测试
console.log('1. 基本日志测试:');
Log.debug('这是DEBUG日志', { level: 'debug' });
Log.info('这是INFO日志', { level: 'info' });
Log.warn('这是WARN日志', { level: 'warn' });
Log.error('这是ERROR日志', { level: 'error' });

// 2. 级别测试
console.log('\n2. 级别测试 - 设置为ERROR级别:');
Log.setLevel(LogLevel.ERROR);
Log.debug('这条DEBUG日志不会显示');
Log.info('这条INFO日志不会显示');
Log.warn('这条WARN日志不会显示');
Log.error('只有这条ERROR日志会显示');

// 3. MCP模式测试
console.log('\n3. MCP模式测试:');
Log.setLevel(LogLevel.INFO);
Log.setMcpMode(true);
Log.info('MCP模式下的日志（输出到stderr）');
Log.setMcpMode(false);
Log.info('正常模式下的日志');

console.log('\n=== 测试完成 ===\n'); 