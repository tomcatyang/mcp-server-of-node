# 日志系统

统一的日志管理系统，支持控制台输出和文件输出。

## ✨ 功能特性

- 🖥️ **控制台输出**：支持不同级别的控制台日志
- 📁 **文件输出**：自动按日期分割的日志文件
- 🔧 **MCP 兼容**：在 MCP 环境下自动使用 stderr 避免 JSON 冲突
- 📊 **多级别**：DEBUG、INFO、WARN、ERROR 四个日志级别
- 🛡️ **容错处理**：文件写入失败时自动降级为仅控制台输出
- 📅 **日期轮转**：按天自动创建新的日志文件

## 🚀 使用方法

### 基本用法

```typescript
import { Log, LogLevel } from './log/logger';

// 基本日志输出
Log.info('这是一条信息日志');
Log.warn('这是一条警告日志');
Log.error('这是一条错误日志');
Log.debug('这是一条调试日志');

// 带数据的日志输出
Log.info('用户操作', { userId: 123, action: 'login' });
Log.error('API 调用失败', { url: '/api/users', status: 500 });
```

### 配置选项

```typescript
// 设置日志级别
Log.setLevel(LogLevel.DEBUG);

// 设置 MCP 模式
Log.setMcpMode(true);

// 设置文件输出开关
Log.setFileOutput(false); // 禁用文件输出
Log.setFileOutput(true);  // 启用文件输出

// 设置自定义日志目录
Log.setLogDirectory('./custom-logs');
```

### 环境变量配置

```bash
# 设置日志目录
export LOG_DIR="/var/log/app"

# 设置 MCP 模式
export MCP_MODE="true"
```

## 📁 日志文件

### 文件命名规则
- 默认位置：`./logs/`
- 文件名格式：`app-YYYY-MM-DD.log`
- 示例：`app-2024-12-28.log`

### 文件内容格式
```
2024-12-28 10:30:45.123 [INFO] 用户登录 {"userId":12345,"username":"test_user"}
2024-12-28 10:30:46.456 [WARN] 连接超时 {"timeout":5000,"retries":3}
2024-12-28 10:30:47.789 [ERROR] 数据库连接失败 {"error":"Connection refused"}
```

## 🔧 高级配置

### Docker 环境
在 Docker 容器中，推荐挂载日志目录：

```yaml
volumes:
  - ./logs:/app/logs
```

### 日志轮转
日志文件按日期自动轮转，无需手动配置。每天会创建新的日志文件。

### 错误处理
- 日志目录创建失败时，自动禁用文件输出
- 文件写入失败时，自动降级为仅控制台输出
- JSON 序列化失败时，使用字符串形式输出

## 🧪 测试

运行测试脚本验证功能：

```bash
# 编译并运行测试
npm run build
node dist/log/test-file-logger.js

# 或者直接运行 TypeScript
npx tsx src/log/test-file-logger.ts
```

## 📊 日志级别

| 级别 | 数值 | 描述 | 使用场景 |
|------|------|------|----------|
| DEBUG | 0 | 调试信息 | 开发调试、详细跟踪 |
| INFO | 1 | 一般信息 | 正常操作、状态变更 |
| WARN | 2 | 警告信息 | 潜在问题、性能警告 |
| ERROR | 3 | 错误信息 | 异常处理、系统错误 |
| NONE | 4 | 关闭日志 | 生产环境静默模式 |

## 🔍 最佳实践

1. **生产环境**：设置 `LogLevel.INFO` 或更高级别
2. **开发环境**：使用 `LogLevel.DEBUG` 查看详细信息
3. **MCP 环境**：自动检测，无需手动配置
4. **敏感数据**：避免在日志中输出密码、令牌等敏感信息
5. **性能考虑**：避免在高频操作中输出大量 DEBUG 日志

## 🛠️ 故障排除

### 常见问题

1. **日志文件未创建**
   - 检查目录权限
   - 确认磁盘空间充足
   - 查看控制台错误信息

2. **日志内容乱码**
   - 确认系统编码为 UTF-8
   - 检查终端编码设置

3. **性能影响**
   - 使用异步文件写入，对性能影响很小
   - 如需极致性能，可禁用文件输出

### 调试命令

```bash
# 检查日志目录
ls -la ./logs/

# 实时查看日志
tail -f ./logs/app-$(date +%Y-%m-%d).log

# 搜索特定日志
grep "ERROR" ./logs/app-*.log
``` 