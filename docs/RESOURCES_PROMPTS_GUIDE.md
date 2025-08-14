# MCP Server Resources & Prompts 使用指南

## 概述

MCP Server of Node 现在支持完整的 MCP 协议功能，包括：
- 🔧 **Tools**: 执行各种操作
- 📁 **Resources**: 提供文件和数据访问
- 💬 **Prompts**: 可复用的提示词模板

## Resources 功能

### 什么是 Resources？

Resources 允许 MCP 服务器向 AI 客户端提供文件和数据访问能力。客户端可以：
- 列出可用的资源
- 读取资源内容
- 订阅资源变化

### 创建 Resource

```typescript
import { ResourceArgs } from 'mcp-server-of-node';

const myResource: ResourceArgs = {
    uri: 'file:///example/data.json',
    name: 'data.json',
    description: '示例数据文件',
    mimeType: 'application/json',
    getContent: async () => ({
        uri: 'file:///example/data.json',
        mimeType: 'application/json',
        text: JSON.stringify({
            message: 'Hello World',
            timestamp: new Date().toISOString()
        })
    })
};
```

### 注册 Resource

```typescript
import resourceService from 'mcp-server-of-node';

// 注册单个资源
resourceService.addResource(myResource);

// 注册多个资源
resourceService.addResources([resource1, resource2]);
```

### Resource 类型示例

#### 1. JSON 配置文件
```typescript
const configResource: ResourceArgs = {
    uri: 'file:///config/app.json',
    name: 'app.json',
    description: '应用程序配置',
    mimeType: 'application/json',
    getContent: async () => ({
        uri: 'file:///config/app.json',
        mimeType: 'application/json',
        text: JSON.stringify({
            appName: 'My App',
            version: '1.0.0',
            features: ['feature1', 'feature2']
        })
    })
};
```

#### 2. Markdown 文档
```typescript
const docResource: ResourceArgs = {
    uri: 'file:///docs/README.md',
    name: 'README.md',
    description: '项目文档',
    mimeType: 'text/markdown',
    getContent: async () => ({
        uri: 'file:///docs/README.md',
        mimeType: 'text/markdown',
        text: `# 项目文档

这是一个示例项目文档。

## 功能特性

- 功能1
- 功能2

## 使用方法

请参考文档了解更多信息。`
    })
};
```

#### 3. 动态数据资源
```typescript
const dynamicResource: ResourceArgs = {
    uri: 'data:///system/status',
    name: 'system-status',
    description: '系统状态信息',
    mimeType: 'application/json',
    getContent: async () => ({
        uri: 'data:///system/status',
        mimeType: 'application/json',
        text: JSON.stringify({
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        })
    })
};
```

## Prompts 功能

### 什么是 Prompts？

Prompts 是可复用的提示词模板，允许 AI 客户端使用预定义的提示词模板来生成内容。

### 创建 Prompt

```typescript
import { PromptArgs } from 'mcp-server-of-node';

const myPrompt: PromptArgs = {
    name: 'greeting',
    title: '问候语生成器',
    description: '生成个性化的问候语',
    arguments: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: '要问候的人名'
            },
            time: {
                type: 'string',
                description: '问候时间（morning/afternoon/evening）'
            }
        },
        required: ['name']
    },
    handle: async (args: any) => {
        const { name, time = 'day' } = args;
        
        const greeting = `Hello ${name}! Have a great ${time}!`;
        
        return {
            promptName: 'greeting',
            promptArgs: args,
            isError: false,
            content: [{
                type: 'text',
                text: greeting
            }]
        };
    }
};
```

### 注册 Prompt

```typescript
import promptService from 'mcp-server-of-node';

// 注册单个提示词
promptService.addPrompt(myPrompt);

// 注册多个提示词
promptService.addPrompts([prompt1, prompt2]);
```

### Prompt 类型示例

#### 1. 代码审查提示词
```typescript
const codeReviewPrompt: PromptArgs = {
    name: 'code_review',
    title: '代码审查',
    description: '生成代码审查提示词',
    arguments: {
        type: 'object',
        properties: {
            code: {
                type: 'string',
                description: '要审查的代码'
            },
            language: {
                type: 'string',
                description: '编程语言'
            }
        },
        required: ['code', 'language']
    },
    handle: async (args: any) => {
        const { code, language } = args;
        
        const prompt = `请对以下${language}代码进行审查：

\`\`\`${language}
${code}
\`\`\`

请从代码质量、安全性、性能等方面进行分析。`;
        
        return {
            promptName: 'code_review',
            promptArgs: args,
            isError: false,
            content: [{
                type: 'text',
                text: prompt
            }]
        };
    }
};
```

#### 2. 文档生成提示词
```typescript
const docPrompt: PromptArgs = {
    name: 'generate_doc',
    title: '文档生成器',
    description: '生成技术文档',
    arguments: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: '文档标题'
            },
            content: {
                type: 'string',
                description: '文档内容'
            },
            format: {
                type: 'string',
                description: '文档格式（markdown/html）'
            }
        },
        required: ['title', 'content']
    },
    handle: async (args: any) => {
        const { title, content, format = 'markdown' } = args;
        
        let docTemplate = '';
        if (format === 'markdown') {
            docTemplate = `# ${title}

${content}

---
*生成时间: ${new Date().toLocaleString()}*`;
        } else {
            docTemplate = `<html>
<head><title>${title}</title></head>
<body>
<h1>${title}</h1>
<p>${content}</p>
<hr>
<em>生成时间: ${new Date().toLocaleString()}</em>
</body>
</html>`;
        }
        
        return {
            promptName: 'generate_doc',
            promptArgs: args,
            isError: false,
            content: [{
                type: 'text',
                text: docTemplate
            }]
        };
    }
};
```

## 在 MCP 服务器中使用

### 1. 更新服务器配置

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
    {
        name: 'my-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
            resources: {
                subscribe: true, // 支持资源订阅
            },
            prompts: {},
        },
    }
);
```

### 2. 设置处理器

```typescript
// 资源列表处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: resourceService.getResourceList(),
    };
});

// 资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const content = await resourceService.getResourceContent(uri);
    return content;
});

// 提示词列表处理器
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: promptService.getPromptList(),
    };
});

// 提示词调用处理器
server.setRequestHandler(CallPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    const args = request.params.arguments;
    const result = await promptService.handlePrompt(promptName, args);
    return result;
});
```

### 3. 注册服务和启动

```typescript
import { MCPServer } from 'mcp-server-of-node';
import resourceService from 'mcp-server-of-node';
import promptService from 'mcp-server-of-node';

// 注册资源
resourceService.addResource(myResource);

// 注册提示词
promptService.addPrompt(myPrompt);

// 启动服务器
const mcpServer = new MCPServer();
await mcpServer.start();
```

## 客户端使用示例

### 列出资源
```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/list"
}
```

### 读取资源
```json
{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
        "uri": "file:///example/data.json"
    }
}
```

### 列出提示词
```json
{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "prompts/list"
}
```

### 调用提示词
```json
{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "prompts/call",
    "params": {
        "name": "greeting",
        "arguments": {
            "name": "Alice",
            "time": "morning"
        }
    }
}
```

## 最佳实践

### Resources 最佳实践

1. **URI 命名规范**: 使用清晰的 URI 格式，如 `file:///category/name.ext`
2. **MIME 类型**: 正确设置 MIME 类型以帮助客户端正确解析内容
3. **异步处理**: 对于大型文件或需要计算的资源，使用异步 `getContent` 函数
4. **错误处理**: 在 `getContent` 中处理可能的错误情况

### Prompts 最佳实践

1. **参数验证**: 使用 JSON Schema 定义清晰的参数结构
2. **模板化**: 创建可重用的提示词模板
3. **上下文感知**: 根据输入参数动态调整提示词内容
4. **错误处理**: 在 `handle` 函数中处理异常情况

### 性能优化

1. **缓存**: 对于静态资源，考虑实现缓存机制
2. **懒加载**: 对于大型资源，考虑实现懒加载
3. **分页**: 对于大量数据，考虑实现分页机制

## 故障排除

### 常见问题

1. **资源未找到**: 检查 URI 是否正确，资源是否已注册
2. **提示词调用失败**: 检查参数是否符合 JSON Schema 定义
3. **MIME 类型错误**: 确保设置了正确的 MIME 类型

### 调试技巧

1. 启用详细日志记录
2. 使用 MCP 客户端的调试工具
3. 检查网络连接和服务器状态

## 总结

通过使用 Resources 和 Prompts 功能，您可以创建功能丰富的 MCP 服务器，为 AI 客户端提供强大的数据访问和内容生成能力。这些功能遵循 MCP 协议标准，确保与各种 MCP 客户端的兼容性。

