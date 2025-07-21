export type ToolArgs = {
    name: string;
    title: string;
    description: string;
    inputSchema: any;
    handle: (args: any) => Promise<ToolResult>;
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