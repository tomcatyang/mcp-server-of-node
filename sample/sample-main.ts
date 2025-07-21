import toolService from "../src/services/tools/tool-service";
import sampleTools from "./sample-tool";
import { ToolArgs } from "../src/services/tools/tool-type";
import  indexModule from "../src/index";

const { main, showHelp } = indexModule;

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}

// 启动服务器
if (require.main === module) {
    // 添加工具
    toolService.addTools(sampleTools);
    // 启动服务器
    main().catch((error) => {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    });
} 