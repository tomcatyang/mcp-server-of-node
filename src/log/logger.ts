import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志级别枚举
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
}

export function getLogLevel(level: string): LogLevel {
    switch(level){
        case 'DEBUG':
            return LogLevel.DEBUG;
        case 'INFO':
            return LogLevel.INFO;
        case 'WARN':
            return LogLevel.WARN;
        case 'ERROR':
            return LogLevel.ERROR;
        case 'NONE':
            return LogLevel.NONE;
        default:
            return LogLevel.INFO;
    }
}

/**
 * 简化的日志输出类
 */
export class Logger {
    private level: LogLevel = LogLevel.INFO;
    private isMcpMode: boolean;
    private logDir: string;
    private logFilePath: string;
    private enableFileOutput: boolean = false;

    constructor() {
        // 自动检测MCP环境
        this.isMcpMode = process.env.MCP_MODE === 'true' || process.argv.includes('mcp');
        
        // 设置日志目录和文件路径
        this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
        this.logFilePath = path.join(this.logDir, `app-${today}.log`);
        
        // 确保日志目录存在
        this.ensureLogDirectory();
    }

    /**
     * 设置日志级别
     */
    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * 设置MCP模式
     */
    public setMcpMode(enabled: boolean): void {
        this.isMcpMode = enabled;
    }

    /**
     * 设置文件输出开关
     */
    public setFileOutput(enabled: boolean): void {
        this.enableFileOutput = enabled;
    }

    /**
     * 设置日志目录
     */
    public setLogDirectory(logDir: string): void {
        this.logDir = logDir;
        const today = new Date().toISOString().split('T')[0];
        this.logFilePath = path.join(this.logDir, `app-${today}.log`);
        this.ensureLogDirectory();
    }

    /**
     * 确保日志目录存在
     */
    private ensureLogDirectory(): void {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error(`无法创建日志目录 ${this.logDir}:`, error);
            this.enableFileOutput = false;
        }
    }

    /**
     * 写入日志到文件
     */
    private writeToFile(message: string): void {
        if (!this.enableFileOutput) {
            return;
        }

        try {
            // 检查是否需要更新日志文件路径（日期变化）
            const today = new Date().toISOString().split('T')[0];
            const expectedPath = path.join(this.logDir, `app-${today}.log`);
            if (this.logFilePath !== expectedPath) {
                this.logFilePath = expectedPath;
            }

            // 异步写入文件，添加换行符
            fs.appendFile(this.logFilePath, message + '\n', (err) => {
                if (err) {
                    console.error(`写入日志文件失败:`, err);
                    // 发生错误时暂时禁用文件输出
                    this.enableFileOutput = false;
                }
            });
        } catch (error) {
            console.error(`日志文件写入异常:`, error);
            this.enableFileOutput = false;
        }
    }

    /**
     * 输出日志
     */
    private output(level: LogLevel, message: string, data?: any): void {
        if (level < this.level) {
            return;
        }

        const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
        const levelText = LogLevel[level];
        
        let formattedMessage = `${timestamp} [${levelText}] ${message}`;
        
        if (data !== undefined) {
            if (typeof data === 'object') {
                try {
                    formattedMessage += ` ${JSON.stringify(data)}`;
                } catch (error) {
                    formattedMessage += ` [JSON序列化失败: ${String(data)}]`;
                }
            } else {
                formattedMessage += ` ${data}`;
            }
        }

        // 输出到控制台
        if (this.isMcpMode) {
            // 在MCP环境中使用stderr避免JSON冲突
            console.error(formattedMessage);
        } else {
            if (level >= LogLevel.ERROR) {
                console.error(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
        }

        // 同时输出到文件
        this.writeToFile(formattedMessage);
    }

    /**
     * DEBUG级别日志
     */
    public debug(message: string, data?: any): void {
        this.output(LogLevel.DEBUG, message, data);
    }

    /**
     * INFO级别日志
     */
    public info(message: string, data?: any): void {
        this.output(LogLevel.INFO, message, data);
    }

    /**
     * WARN级别日志
     */
    public warn(message: string, data?: any): void {
        this.output(LogLevel.WARN, message, data);
    }

    /**
     * ERROR级别日志
     */
    public error(message: string, data?: any): void {
        this.output(LogLevel.ERROR, message, data);
    }
}

/**
 * 默认全局日志器实例
 */
export const Log = new Logger(); 