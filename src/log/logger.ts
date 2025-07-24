/**
 * 日志级别枚举
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * 简化的日志输出类
 */
export class Logger {
    private level: LogLevel = LogLevel.INFO;
    private isMcpMode: boolean;

    constructor() {
        // 自动检测MCP环境
        this.isMcpMode = process.env.MCP_MODE === 'true' || process.argv.includes('mcp');
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
                formattedMessage += ` ${JSON.stringify(data)}`;
            } else {
                formattedMessage += ` ${data}`;
            }
        }

        // 在MCP环境中使用stderr避免JSON冲突
        if (this.isMcpMode) {
            console.error(formattedMessage);
        } else {
            if (level >= LogLevel.ERROR) {
                console.error(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
        }
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