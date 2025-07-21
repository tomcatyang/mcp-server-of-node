#!/bin/bash

# MCP Server of Node 本地安装脚本
# 用于构建、打包和安装本地开发版本

set -e  # 遇到错误立即退出

echo "🚀 开始安装 mcp-server-of-node 本地包..."

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js (>=18.0.0)"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    if ! npm list -g semver &> /dev/null; then
        echo "⚠️  警告: Node.js版本可能过低，建议使用18.0.0或更高版本"
    fi
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 1. 清理之前的构建
echo ""
echo "🧹 清理之前的构建..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "   已清理 dist 目录"
fi

if [ -f "*.tgz" ]; then
    rm -f *.tgz
    echo "   已清理旧的包文件"
fi

# 2. 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 3. 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo "❌ 构建失败: dist/index.js 不存在"
    exit 1
fi

echo "✅ 构建成功"

# 4. 打包项目
echo ""
echo "📦 打包项目..."
PACKAGE_FILE=$(npm pack)

if [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ 打包失败: 包文件不存在"
    exit 1
fi

echo "✅ 打包成功: $PACKAGE_FILE"

# 5. 全局安装
echo ""
echo "🌐 全局安装包..."

# 检查是否已经全局安装
if npm list -g mcp-server-of-node &> /dev/null; then
    echo "⚠️  检测到已安装的全局版本，正在卸载..."
    npm uninstall -g mcp-server-of-node
fi

# 安装新版本
npm install -g "./$PACKAGE_FILE"

# 6. 验证安装
echo ""
echo "🔍 验证安装..."

if command -v mcp-server-of-node &> /dev/null; then
    echo "✅ 全局命令可用"
    
    # 测试帮助命令
    echo ""
    echo "📋 测试帮助命令:"
    mcp-server-of-node --help
    
    echo ""
    echo "🎉 安装成功！"
    echo ""
    echo "使用方法："
    echo "  mcp-server-of-node          # 启动MCP服务器"
    echo "  mcp-server-of-node sse      # 启动SSE服务器"
    echo "  mcp-server-of-node --help   # 显示帮助信息"
    
else
    echo "❌ 安装失败: 全局命令不可用"
    echo "请检查npm全局bin目录是否在PATH中："
    echo "  npm config get prefix"
    echo "  echo \$PATH"
    exit 1
fi

# 7. 清理临时文件（可选）
echo ""
read -p "🗑️  是否清理打包文件 $PACKAGE_FILE? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$PACKAGE_FILE"
    echo "✅ 已清理打包文件"
else
    echo "📦 保留打包文件: $PACKAGE_FILE"
fi

echo ""
echo "🚀 mcp-server-of-node 安装完成！"
