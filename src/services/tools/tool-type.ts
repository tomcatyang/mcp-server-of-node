export type InputSchema = {
    type: string; // object
    properties: { // 属性列表
        [key: string]: {
            type: string;
            description: string;
        };
    };
    required: string[]; // 必填字段
}

export type ToolArgs = {
    name: string;
    title: string;
    description: string;
    inputSchema: InputSchema;
    handle: (args: object) => Promise<ToolResult>; // 工具处理函数
}

export type ToolResult = {
    toolName: string;
    toolArgs: any;
    isError: boolean;
    content: {
        type: string; // text, image, video, audio, file, link, table, list, other
        text?: string;
        data?: string; //如果是图片，则data为base64编码的图片数据
        mimeType?: string; //如果是图片，则mimeType为图片的mime类型
    }[];
}

// Resource 相关类型定义
export type ResourceArgs = {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    getContent: (args: object) => Promise<ResourceContent>;
}

export type ResourceContent = {
    content: [
        {
            uri: string;        // 资源uri
            mimeType?: string;  // 资源类型 
            // 下面二选一:
            text?: string;      // 文本内容
            blob?: string;      // base64后的二进制内容
        }
    ]
}

// Prompt 相关类型定义
export type PromptArgs = {
    name: string;
    description: string;
    arguments: {
        name: string;
        description: string;
        required: boolean;
    }[];
    handle: (args: object) => Promise<PromptResult>;
}

export type PromptResult = {
    description: string;
    messages: {
        role: string, //"user"
        content: {
          type: string, //"text"
          text: string, //"Please analyze the following Python code for potential improvements:\n\n```python\ndef calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total = total + num\n    return total\n\nresult = calculate_sum([1, 2, 3, 4, 5])\nprint(result)\n```"
        }
      }[];
}

export type ServerInfo = {
    name: string;
    port: number;
    version: string;
    description: string;
}