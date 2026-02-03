#!/bin/bash

# SnippetsHub Release Script
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh v1.0.1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if version is provided
if [ -z "$1" ]; then
    print_error "Version is required!"
    echo "Usage: $0 <version>"
    echo "Example: $0 v1.0.1"
    exit 1
fi

VERSION=$1

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use vX.Y.Z (e.g., v1.0.1)"
    exit 1
fi

# Extract version without 'v' prefix
VERSION_NUMBER=${VERSION#v}

print_status "Starting release process for SnippetsHub $VERSION"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the code_hub directory."
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
fi

# Update version in package.json
print_status "Updating package.json version to $VERSION_NUMBER"
npm version $VERSION_NUMBER --no-git-tag-version

# Update version in Cargo.toml
print_status "Updating Cargo.toml version to $VERSION_NUMBER"
sed -i.bak "s/^version = \".*\"/version = \"$VERSION_NUMBER\"/" src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

# Update version in tauri.conf.json
print_status "Updating tauri.conf.json version to $VERSION_NUMBER"
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION_NUMBER\"/" src-tauri/tauri.conf.json
rm src-tauri/tauri.conf.json.bak

# Run tests
print_status "Running tests..."
npm run test:run || {
    print_error "Tests failed. Please fix them before releasing."
    exit 1
}

# Build the application
print_status "Building application..."
npm run build || {
    print_error "Build failed. Please fix build errors before releasing."
    exit 1
}

# Commit version changes
print_status "Committing version changes..."
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to $VERSION"

# Create and push tag
print_status "Creating and pushing tag $VERSION..."
git tag -a $VERSION -m "Release $VERSION"
git push origin main
git push origin $VERSION

print_success "Release $VERSION has been created and pushed!"
print_status "GitHub Actions will now build and publish the release automatically."
print_status "You can monitor the progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"

# Generate release notes
print_status "Generating release notes..."
cat > RELEASE_NOTES.md << EOF
# SnippetsHub $VERSION

## 🚀 新功能
- 自动更新系统
- 多平台支持 (macOS, Windows, Linux)
- 性能优化

## 🐛 错误修复
- 修复已知问题
- 提升稳定性

## 📦 下载
- **macOS**: SnippetsHub_${VERSION}_universal.dmg
- **Windows**: SnippetsHub_${VERSION}_x64_en-US.msi  
- **Linux**: SnippetsHub_${VERSION}_amd64.AppImage

## 📋 系统要求
- **macOS**: 10.15 或更高版本
- **Windows**: Windows 10 或更高版本
- **Linux**: 现代 Linux 发行版 (Ubuntu 18.04+, Fedora 32+, 等)

---
完整更新日志请查看 [GitHub Releases](https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases)
EOF

print_success "Release notes generated in RELEASE_NOTES.md"
print_status "Please review and update the release notes on GitHub if needed."