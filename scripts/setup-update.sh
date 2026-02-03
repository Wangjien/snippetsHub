#!/bin/bash

# SnippetsHub 联网更新快速配置脚本
# 使用方法: ./scripts/setup-update.sh [github-repo-url]

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

print_header() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  SnippetsHub 联网更新配置向导"
    echo "=================================="
    echo -e "${NC}"
}

# 检查必要工具
check_dependencies() {
    print_status "检查依赖工具..."
    
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo 未安装，请先安装 Rust"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    print_success "依赖检查完成"
}

# 安装 Tauri CLI
install_tauri_cli() {
    print_status "检查 Tauri CLI..."
    
    if ! command -v tauri &> /dev/null; then
        print_status "安装 Tauri CLI..."
        cargo install tauri-cli
        print_success "Tauri CLI 安装完成"
    else
        print_success "Tauri CLI 已安装"
    fi
}

# 生成签名密钥
generate_keys() {
    print_status "生成更新签名密钥..."
    
    # 创建密钥目录
    mkdir -p ~/.tauri
    
    # 生成密钥对
    if [ ! -f ~/.tauri/snippetshub.key ]; then
        print_status "生成新的签名密钥对..."
        tauri signer generate -w ~/.tauri/snippetshub.key
        print_success "签名密钥生成完成"
    else
        print_warning "签名密钥已存在，跳过生成"
    fi
    
    # 显示公钥
    echo ""
    print_status "您的公钥内容 (请复制到 tauri.conf.json):"
    echo -e "${YELLOW}"
    cat ~/.tauri/snippetshub.key.pub
    echo -e "${NC}"
    echo ""
}

# 更新 Tauri 配置
update_tauri_config() {
    local repo_url=$1
    local pubkey=$(cat ~/.tauri/snippetshub.key.pub)
    
    print_status "更新 Tauri 配置文件..."
    
    # 提取仓库信息
    if [[ $repo_url =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        local username=${BASH_REMATCH[1]}
        local reponame=${BASH_REMATCH[2]}
        local endpoint="https://github.com/${username}/${reponame}/releases/latest/download/latest.json"
        
        print_status "配置更新端点: $endpoint"
        
        # 备份原配置
        cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.backup
        
        # 使用 jq 更新配置 (如果可用)
        if command -v jq &> /dev/null; then
            jq --arg endpoint "$endpoint" --arg pubkey "$pubkey" \
               '.plugins.updater.endpoints = [$endpoint] | .plugins.updater.pubkey = $pubkey' \
               src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp
            mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
            print_success "Tauri 配置已更新"
        else
            print_warning "jq 未安装，请手动更新 src-tauri/tauri.conf.json"
            echo "更新端点: $endpoint"
            echo "公钥: $pubkey"
        fi
    else
        print_error "无效的 GitHub 仓库 URL"
        exit 1
    fi
}

# 设置 Git 仓库
setup_git_repo() {
    local repo_url=$1
    
    print_status "配置 Git 仓库..."
    
    if [ ! -d .git ]; then
        git init
        print_status "Git 仓库已初始化"
    fi
    
    # 检查是否已有 origin
    if git remote get-url origin &> /dev/null; then
        print_warning "Git remote origin 已存在"
        git remote set-url origin "$repo_url"
    else
        git remote add origin "$repo_url"
    fi
    
    print_success "Git 仓库配置完成"
}

# 创建初始提交
create_initial_commit() {
    print_status "创建初始提交..."
    
    git add .
    if git diff --staged --quiet; then
        print_warning "没有需要提交的更改"
    else
        git commit -m "feat: 添加联网自动更新功能

- 实现 UpdateManager 组件
- 配置 GitHub Actions 多平台构建
- 添加自动更新签名验证
- 支持 macOS、Windows、Linux 平台"
        print_success "初始提交已创建"
    fi
}

# 推送到 GitHub
push_to_github() {
    print_status "推送代码到 GitHub..."
    
    git branch -M main
    git push -u origin main
    print_success "代码已推送到 GitHub"
}

# 显示后续步骤
show_next_steps() {
    echo ""
    print_success "联网更新配置完成！"
    echo ""
    print_status "接下来的步骤:"
    echo "1. 在 GitHub 仓库设置中添加 Secrets:"
    echo "   - TAURI_PRIVATE_KEY: $(cat ~/.tauri/snippetshub.key | base64 -w 0 2>/dev/null || cat ~/.tauri/snippetshub.key | base64)"
    echo "   - TAURI_KEY_PASSWORD: (如果设置了密码)"
    echo ""
    echo "2. 创建第一个发布版本:"
    echo "   ./scripts/release.sh v1.0.0"
    echo ""
    echo "3. 等待 GitHub Actions 构建完成"
    echo ""
    echo "4. 下载并测试自动更新功能"
    echo ""
    print_warning "重要提醒:"
    echo "- 请妥善保管私钥文件: ~/.tauri/snippetshub.key"
    echo "- 不要将私钥提交到代码仓库"
    echo "- 定期备份签名密钥"
}

# 主函数
main() {
    print_header
    
    # 检查参数
    if [ -z "$1" ]; then
        print_error "请提供 GitHub 仓库 URL"
        echo "使用方法: $0 https://github.com/username/snippetshub"
        exit 1
    fi
    
    local repo_url=$1
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -f "src-tauri/tauri.conf.json" ]; then
        print_error "请在 SnippetsHub 项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行配置步骤
    check_dependencies
    install_tauri_cli
    generate_keys
    update_tauri_config "$repo_url"
    setup_git_repo "$repo_url"
    create_initial_commit
    
    # 询问是否推送到 GitHub
    echo ""
    read -p "是否现在推送代码到 GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_to_github
    else
        print_warning "跳过推送，您可以稍后手动推送:"
        echo "git push -u origin main"
    fi
    
    show_next_steps
}

# 运行主函数
main "$@"