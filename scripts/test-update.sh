#!/bin/bash

# SnippetsHub 联网更新测试脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建测试更新服务器
create_test_server() {
    print_status "创建测试更新服务器..."
    
    mkdir -p test-update-server
    cd test-update-server
    
    # 创建模拟的更新清单
    cat > latest.json << EOF
{
  "version": "v1.0.1",
  "notes": "测试更新版本\\n\\n## 新功能\\n- 测试自动更新功能\\n- 优化用户体验\\n\\n## 修复\\n- 修复已知问题",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "darwin-universal": {
      "signature": "",
      "url": "http://localhost:8000/SnippetsHub_v1.0.1_universal.dmg"
    },
    "linux-x86_64": {
      "signature": "",
      "url": "http://localhost:8000/SnippetsHub_v1.0.1_amd64.AppImage"
    },
    "windows-x86_64": {
      "signature": "",
      "url": "http://localhost:8000/SnippetsHub_v1.0.1_x64_en-US.msi"
    }
  }
}
EOF
    
    print_success "测试更新清单已创建"
    cd ..
}

# 启动测试服务器
start_test_server() {
    print_status "启动测试更新服务器..."
    
    cd test-update-server
    
    # 检查端口是否被占用
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "端口 8000 已被占用，尝试停止现有服务..."
        pkill -f "python.*http.server.*8000" || true
        sleep 2
    fi
    
    # 启动 HTTP 服务器
    print_status "在 http://localhost:8000 启动测试服务器..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    
    # 等待服务器启动
    sleep 2
    
    # 测试服务器是否正常
    if curl -s http://localhost:8000/latest.json > /dev/null; then
        print_success "测试服务器启动成功"
        echo "服务器 PID: $SERVER_PID"
        echo "更新清单: http://localhost:8000/latest.json"
    else
        print_error "测试服务器启动失败"
        exit 1
    fi
    
    cd ..
}

# 备份并修改 Tauri 配置
modify_tauri_config() {
    print_status "修改 Tauri 配置指向测试服务器..."
    
    # 备份原配置
    cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.test-backup
    
    # 修改配置指向本地测试服务器
    if command -v jq &> /dev/null; then
        jq '.plugins.updater.endpoints = ["http://localhost:8000/latest.json"]' \
           src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp
        mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
        print_success "Tauri 配置已修改"
    else
        print_warning "jq 未安装，请手动修改 src-tauri/tauri.conf.json"
        echo '将 endpoints 修改为: ["http://localhost:8000/latest.json"]'
        read -p "修改完成后按 Enter 继续..."
    fi
}

# 恢复 Tauri 配置
restore_tauri_config() {
    print_status "恢复 Tauri 配置..."
    
    if [ -f src-tauri/tauri.conf.json.test-backup ]; then
        mv src-tauri/tauri.conf.json.test-backup src-tauri/tauri.conf.json
        print_success "Tauri 配置已恢复"
    fi
}

# 构建并测试应用
build_and_test() {
    print_status "构建测试版本..."
    
    # 构建应用
    npm run tauri build -- --debug
    
    if [ $? -eq 0 ]; then
        print_success "应用构建成功"
        
        # 查找构建产物
        if [[ "$OSTYPE" == "darwin"* ]]; then
            APP_PATH=$(find src-tauri/target -name "*.app" -type d | head -1)
            if [ -n "$APP_PATH" ]; then
                print_status "启动应用进行更新测试..."
                print_warning "请在应用中测试自动更新功能"
                open "$APP_PATH"
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            APP_PATH=$(find src-tauri/target -name "snippetshub" -type f -executable | head -1)
            if [ -n "$APP_PATH" ]; then
                print_status "启动应用进行更新测试..."
                print_warning "请在应用中测试自动更新功能"
                "$APP_PATH" &
            fi
        fi
    else
        print_error "应用构建失败"
        exit 1
    fi
}

# 停止测试服务器
stop_test_server() {
    print_status "停止测试服务器..."
    
    if [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    # 清理可能残留的进程
    pkill -f "python.*http.server.*8000" 2>/dev/null || true
    
    print_success "测试服务器已停止"
}

# 清理测试文件
cleanup() {
    print_status "清理测试文件..."
    
    # 恢复配置
    restore_tauri_config
    
    # 删除测试服务器目录
    rm -rf test-update-server
    
    print_success "清理完成"
}

# 显示测试说明
show_test_instructions() {
    echo ""
    print_success "更新测试环境已准备就绪！"
    echo ""
    print_status "测试步骤:"
    echo "1. 应用已启动，当前版本应该是 v1.0.0"
    echo "2. 应用会自动检查更新并发现 v1.0.1"
    echo "3. 点击更新通知测试更新流程"
    echo "4. 观察下载进度和错误处理"
    echo ""
    print_warning "注意事项:"
    echo "- 这是模拟测试，不会真正安装更新"
    echo "- 下载会失败，这是正常的（因为没有真实的安装包）"
    echo "- 主要测试更新检查和UI交互"
    echo ""
    echo "测试完成后按 Ctrl+C 停止脚本"
}

# 信号处理
trap 'stop_test_server; cleanup; exit 0' INT TERM

# 主函数
main() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  SnippetsHub 联网更新测试工具"
    echo "=================================="
    echo -e "${NC}"
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -f "src-tauri/tauri.conf.json" ]; then
        print_error "请在 SnippetsHub 项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行测试步骤
    create_test_server
    start_test_server
    modify_tauri_config
    build_and_test
    show_test_instructions
    
    # 等待用户中断
    while true; do
        sleep 1
    done
}

# 运行主函数
main "$@"