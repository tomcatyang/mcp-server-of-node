import toolService from '../services/tools/tool-service';
import indexModule from '../index';
import sampleTools from './sample-tool';

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
    // 启动服务器
    main().catch((error) => {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    });
} 
