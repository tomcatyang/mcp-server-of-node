# MCP Server of Node

MCP服务器基础框架 - 支持标准MCP协议和SSE实时通信功能，通过基础框架，继承开发各种mcp服务功能,扩展使用方法请参考src/smaple目录的例子

## 功能特性

- 🔌 **标准MCP协议支持**: 完全兼容Model Context Protocol规范
- 📡 **SSE实时通信**: 支持Server-Sent Events实时数据推送
- 🏗️ **模块化架构**: 清晰的代码结构，易于扩展
- 🎯 **工具系统**: 灵活的工具注册和处理机制
- 📁 **资源管理**: 支持文件和数据资源访问
- 💬 **提示词系统**: 可复用的提示词模板
- 🌐 **Web界面**: 内置HTTP服务器和测试页面
- ⚡ **开箱即用**: 快速启动MCP和SSE服务

## 安装

```bash
npm install mcp-server-of-node
```

## 使用方法

### 全局安装测试
``` javascript
npm install -g mcp-server-of-node

// mcp服务，可在cursor等支持mcp的客户端配置command模式
npx mcp-server-of-node --mcp

// sse mcp服务，可在cursor等支持mcp的客户端配置http sse模式
npx mcp-server-of-node --sse //启动http服务，默认端口3000，可--port指定端口

// 详细命令可以通过命令查询
npx mcp-server-of-node --help
```

在MCP协议中：
stdout 用于JSON-RPC消息传输，必须保持纯净
stderr 用于日志输出，不会干扰协议通信
所以当检测到MCP环境时，所有日志都输出到stderr，确保不会破坏MCP协议的JSON格式。

### 基本用法

```javascript
import { MCPServer } from 'mcp-server-of-node';

const server = new MCPServer();
await server.start();
```

### SSE服务器

```javascript
import { SSEServer } from 'mcp-server-of-node';
const name='mcp-of-smaple';
const port=3000;
const version='1.0.0';
const description='MCP Server of Node Sample';
const sseServer = new SSEServer({name, port, version, description});
await sseServer.start();
```

### 工具服务管理

```javascript
import { toolService, ToolArgs, ToolResult } from 'mcp-server-of-node';

// 创建自定义工具
const myTool: ToolArgs = {
    name: 'my_tool',
    title: '我的工具',
    description: '这是一个示例工具',
    inputSchema: {
        type: 'object',
        properties: {
            message: { type: 'string', description: '输入消息' }
        },
        required: ['message']
    },
    handle: async (args: any): Promise<ToolResult> => {
        return {
            content: [{
                type: "text",
                text: `你输入的消息是: ${args.message}`
            }],
            toolName: 'my_tool',
            toolArgs: args,
            isError: false
        };
    }
};

// 添加工具到服务
toolService.addTool(myTool);

// 获取所有工具
const allTools = toolService.getToolList();
console.log('已注册的工具:', allTools.map(t => t.name));
```

### 完整示例

```javascript
import { MCPServer, SSEServer, toolService, ToolArgs } from 'mcp-server-of-node';

// 创建工具
const weatherTool: ToolArgs = {
    name: 'get_weather',
    title: '天气查询',
    description: '查询指定城市的天气',
    inputSchema: {
        type: 'object',
        properties: {
            city: { type: 'string', description: '城市名称' }
        },
        required: ['city']
    },
    handle: async (args) => {
        // 模拟天气查询
        return {
            content: [{
                type: "text",
                text: `${args.city}今天天气晴朗，温度25°C`
            }],
            toolName: 'get_weather',
            toolArgs: args,
            isError: false
        };
    }
};

// 注册工具
toolService.addTool(weatherTool);

// 启动MCP服务器
const mcpServer = new MCPServer();
await mcpServer.start();

// 或者启动SSE服务器
// const sseServer = new SSEServer(3000);
// await sseServer.start();
```

## MCP工具开发指南

### 1. 工具类型定义

框架提供了标准的工具类型定义：

```typescript
export type ToolArgs = {
    name: string;           // 工具名称
    title: string;          // 工具标题
    description: string;    // 工具描述
    inputSchema: any;       // 输入参数JSON Schema
    handle: (args: any) => Promise<ToolResult>;  // 工具处理函数
}

export type ToolResult = {
    toolName: string;       // 工具名称
    toolArgs: any;         // 输入参数
    isError: boolean;      // 是否错误
    content: {             // 返回内容
        type: string;      // 内容类型: text, image, video, audio, file, link, table, list, other
        text?: string;     // 文本内容
        image?: string;    // 图片URL或Base64
        video?: string;    // 视频URL
        audio?: string;    // 音频URL
        file?: string;     // 文件路径或URL
        link?: string;     // 链接URL
        table?: string;    // 表格数据(JSON字符串)
        list?: string;     // 列表数据(JSON字符串)
        other?: string;    // 其他类型数据
    }[];
}
```

### 2. 创建工具示例

以天气查询工具为例：

```typescript
import { ToolArgs, ToolResult } from "mcp-server-of-node";

const weatherTool: ToolArgs = {
    name: 'show_weather',
    title: '天气查询',
    description: '查询指定地点的天气信息',
    inputSchema: {
        type: 'object',
        properties: {
            location: { 
                type: 'string', 
                description: '查询的地点名称，如：北京、上海、深圳等' 
            },
        },
        required: ['location'],
    },
    handle: async (args: any): Promise<ToolResult> => {
        const { location } = args;
        
        try {
            // 这里可以调用实际的天气API
            const weatherData = await getWeatherFromAPI(location);
            
            return {
                content: [{
                    type: "text",
                    text: `📍 ${location}天气信息：
🌤️ 天气：${weatherData.condition}
🌡️ 温度：${weatherData.temperature}°C
💧 湿度：${weatherData.humidity}%
🌬️ 风速：${weatherData.windSpeed} km/h`,
                }],
                toolName: 'show_weather',
                toolArgs: args,
                isError: false
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `❌ 获取${location}天气信息失败：${error.message}`,
                }],
                toolName: 'show_weather',
                toolArgs: args,
                isError: true
            };
        }
    }
};

// 模拟天气API调用
async function getWeatherFromAPI(location: string) {
    // 实际项目中这里应该调用真实的天气API
    return {
        condition: '晴朗',
        temperature: 20,
        humidity: 50,
        windSpeed: 5
    };
}

export default [weatherTool];
```

### 3. 注册和使用工具

```typescript
import indexModule, { MCPServer,toolService } from 'mcp-server-of-node';

const { main, showHelp} = indexModule;

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}


// 启动服务器，添加例子工具
if (require.main === module) {
    // 添加工具
    toolService.addTools(weatherTools);
        // 设置环境变量
    process.env.SSE_SERVER_NAME = 'mcp-server-of-node-sample';
    process.env.SSE_SERVER_VERSION = '1.0.0';
    process.env.SSE_SERVER_DESCRIPTION = 'MCP Server of Node Sample';
    // 启动服务器
    main().catch((error) => {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    });
} 
```

### 4. 多种内容类型示例

```typescript
// 返回图片
const imageToolResult: ToolResult = {
    content: [{
        type: "image",
        image: "https://example.com/weather-map.jpg"
    }],
    toolName: 'weather_map',
    toolArgs: args,
    isError: false
};

// 返回表格数据
const tableToolResult: ToolResult = {
    content: [{
        type: "table",
        table: JSON.stringify({
            headers: ['城市', '温度', '湿度'],
            rows: [
                ['北京', '20°C', '50%'],
                ['上海', '25°C', '60%'],
                ['深圳', '28°C', '70%']
            ]
        })
    }],
    toolName: 'weather_comparison',
    toolArgs: args,
    isError: false
};

// 返回链接
const linkToolResult: ToolResult = {
    content: [{
        type: "link",
        link: "https://weather.com/forecast",
        text: "查看详细天气预报"
    }],
    toolName: 'weather_forecast_link',
    toolArgs: args,
    isError: false
};
```

### 5. 输入参数验证

```typescript
const advancedTool: ToolArgs = {
    name: 'advanced_weather',
    title: '高级天气查询',
    description: '查询多地点多日期的天气信息',
    inputSchema: {
        type: 'object',
        properties: {
            locations: {
                type: 'array',
                items: { type: 'string' },
                description: '查询的地点列表',
                minItems: 1,
                maxItems: 5
            },
            days: {
                type: 'number',
                description: '查询天数',
                minimum: 1,
                maximum: 7,
                default: 1
            },
            includeDetails: {
                type: 'boolean',
                description: '是否包含详细信息',
                default: false
            }
        },
        required: ['locations'],
    },
    handle: async (args: any): Promise<ToolResult> => {
        const { locations, days = 1, includeDetails = false } = args;
        
        // 参数验证
        if (!Array.isArray(locations) || locations.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: "❌ 参数错误：locations必须是非空数组"
                }],
                toolName: 'advanced_weather',
                toolArgs: args,
                isError: true
            };
        }
        
        // 处理逻辑...
        const results = await Promise.all(
            locations.map(location => getWeatherForecast(location, days, includeDetails))
        );
        
        return {
            content: [{
                type: "text",
                text: formatWeatherResults(results)
            }],
            toolName: 'advanced_weather',
            toolArgs: args,
            isError: false
        };
    }
};
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 启动SSE服务器
npm run start:sse
```

## 项目结构

```
mcp-server-of-node/
├── src/
│   ├── index.ts                    # 主入口文件
│   ├── mcp-server.ts               # MCP服务器实现
│   ├── sse-server.ts               # SSE服务器实现
│   ├── sample/
│   │   └── sample-tool.ts          # 示例工具
│   └── services/
│       ├── mcp-service.ts          # MCP服务核心
│       ├── tools/
│       │   ├── tool-service.ts     # 工具服务管理
│       │   └── tool-type.ts        # 工具类型定义
│       └── sse/                    # SSE相关服务
├── public/                         # 静态文件
├── dist/                          # 编译输出
└── package.json
```

## 最佳实践

1. **错误处理**: 始终在工具处理函数中进行适当的错误处理
2. **参数验证**: 使用JSON Schema验证输入参数
3. **异步操作**: 支持异步工具操作，如API调用
4. **内容类型**: 根据返回内容选择合适的content type
5. **性能优化**: 对于耗时操作考虑添加超时和缓存机制

## 许可证

ISC 