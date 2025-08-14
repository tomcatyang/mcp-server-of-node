import toolService from '../services/tools/tool-service';
import resourceService from '../services/resources/resource-service';
import promptService from '../services/prompts/prompt-service';
import indexModule from '../index';
import sampleTools from './sample-tool';
import { sampleResources, samplePrompts } from './sample-resources-prompts';

const { main, showHelp} = indexModule;

// tool 开发 demo ，启动index.ts代码例子

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}


// 启动服务器，添加例子工具
if (require.main === module) {
    // 添加工具
    toolService.addTools(sampleTools);
    // resourceService.addResources(sampleResources);
    // promptService.addPrompts(samplePrompts);

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
