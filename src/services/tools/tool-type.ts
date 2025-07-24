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
        image?: string;
        video?: string;
        audio?: string
        file?: string;
        link?: string;
        table?: string;
        list?: string;
        other?: string;
    }[];
}

export type ServerInfo = {
    name: string;
    port: number;
    version: string;
    description: string;
}