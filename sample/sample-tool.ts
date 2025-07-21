import { ToolArgs, ToolResult } from "../src/services/tools/tool-type";

const sampleTools: ToolArgs[] = [
    {
        name: 'show_weather',
        description: '读取天气信息',
        title: '读取天气信息',
        inputSchema: {
            type: 'object',
            properties: {
                location: { type: 'string', description: 'location' },
            },
            required: ['location'],
        },
        handle: async (args: any): Promise<ToolResult> => {
            return {
                content: [{
                    type: "text",
                    text: `天气信息: ${args.location}, 天气晴朗, 温度20度, 湿度50%`,
                }],
                toolName: 'show_weather',
                toolArgs: args,
                isError: false
            };
        }
    }
];

export default sampleTools;