import resourceService from '../services/resources/resource-service';
import promptService from '../services/prompts/prompt-service';
import { ResourceArgs, PromptArgs } from '../services/tools/tool-type';

// 示例资源
export const sampleResources: ResourceArgs[] = [
    {
        uri: 'file:///example/config.json',
        name: 'config.json',
        description: '配置文件示例',
        mimeType: 'application/json',
        getContent: async (args: object) => ({
            content: [
                {
                    uri: 'file:///example/config.json',
                    mimeType: 'application/json',
                    text: '{"name": "config", "version": "1.0.0"}'
                }
            ]
        })
    },
    {
        uri: 'file:///example/readme.md',
        name: 'README.md',
        description: '项目说明文档',
        mimeType: 'text/markdown',
        getContent: async (args: object) => ({
            content: [
                {
                    uri: 'file:///example/readme.md',
                    mimeType: 'text/markdown',
                    text: 'This is a README.md file'
                }
            ]
        })
    }
];



// 示例提示词
export const samplePrompts: PromptArgs[] = [
    {
        name: 'code_review',
        description: '用于代码审查的标准化提示词模板',
        arguments: [
            {
                name: 'language',
                description: '编程语言',
                required: true
            },
            {
                name: 'code',
                description: '要审查的代码',
                required: true
            },
            {
                name: 'focus',
                description: '审查重点（可选，默认为general）',
                required: false
            }
        ],
        handle: async (args: object) => {
            const { code, language, focus = 'general' } = args as { code: string, language: string, focus: string };
            
            const promptText = `请对以下${language}代码进行${focus}方面的审查：
                \`\`\`${language}
                ${code}
                \`\`\`

                请从以下方面进行分析：
                1. 代码质量和可读性
                2. 潜在的问题和风险
                3. 性能优化建议
                4. 最佳实践建议

                请提供详细的审查报告。`;

            return {
                description: '代码审查提示词',
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: promptText
                    }
                }]
            };
        }
    },
];

// 注册示例资源
export function registerSampleResources() {
    resourceService.addResources(sampleResources);
}

// 注册示例提示词
export function registerSamplePrompts() {
    promptService.addPrompts(samplePrompts);
}

// 注册所有示例
export function registerAllSamples() {
    registerSampleResources();
    registerSamplePrompts();
}

