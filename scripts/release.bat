@echo off
setlocal enabledelayedexpansion

REM SnippetsHub Release Script for Windows
REM Usage: scripts\release.bat [version]
REM Example: scripts\release.bat v1.0.1

if "%1"=="" (
    echo [ERROR] Version is required!
    echo Usage: %0 ^<version^>
    echo Example: %0 v1.0.1
    exit /b 1
)

set VERSION=%1
set VERSION_NUMBER=%VERSION:v=%

echo [INFO] Starting release process for SnippetsHub %VERSION%

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the code_hub directory.
    exit /b 1
)

REM Check if git is clean
git status --porcelain > temp_status.txt
set /p GIT_STATUS=<temp_status.txt
del temp_status.txt

if not "%GIT_STATUS%"=="" (
    echo [WARNING] Working directory is not clean. Please commit or stash changes first.
    git status --short
    exit /b 1
)

REM Update version in package.json
echo [INFO] Updating package.json version to %VERSION_NUMBER%
call npm version %VERSION_NUMBER% --no-git-tag-version

REM Update version in Cargo.toml
echo [INFO] Updating Cargo.toml version to %VERSION_NUMBER%
powershell -Command "(Get-Content src-tauri\Cargo.toml) -replace '^version = \".*\"', 'version = \"%VERSION_NUMBER%\"' | Set-Content src-tauri\Cargo.toml"

REM Update version in tauri.conf.json
echo [INFO] Updating tauri.conf.json version to %VERSION_NUMBER%
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"version\": \".*\"', '\"version\": \"%VERSION_NUMBER%\"' | Set-Content src-tauri\tauri.conf.json"

REM Run tests
echo [INFO] Running tests...
call npm run test:run
if errorlevel 1 (
    echo [ERROR] Tests failed. Please fix them before releasing.
    exit /b 1
)

REM Build the application
echo [INFO] Building application...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Please fix build errors before releasing.
    exit /b 1
)

REM Commit version changes
echo [INFO] Committing version changes...
git add package.json src-tauri\Cargo.toml src-tauri\tauri.conf.json
git commit -m "chore: bump version to %VERSION%"

REM Create and push tag
echo [INFO] Creating and pushing tag %VERSION%...
git tag -a %VERSION% -m "Release %VERSION%"
git push origin main
git push origin %VERSION%

echo [SUCCESS] Release %VERSION% has been created and pushed!
echo [INFO] GitHub Actions will now build and publish the release automatically.

REM Generate release notes
echo [INFO] Generating release notes...
(
echo # SnippetsHub %VERSION%
echo.
echo ## 🚀 新功能
echo - 自动更新系统
echo - 多平台支持 ^(macOS, Windows, Linux^)
echo - 性能优化
echo.
echo ## 🐛 错误修复
echo - 修复已知问题
echo - 提升稳定性
echo.
echo ## 📦 下载
echo - **macOS**: SnippetsHub_%VERSION%_universal.dmg
echo - **Windows**: SnippetsHub_%VERSION%_x64_en-US.msi
echo - **Linux**: SnippetsHub_%VERSION%_amd64.AppImage
echo.
echo ## 📋 系统要求
echo - **macOS**: 10.15 或更高版本
echo - **Windows**: Windows 10 或更高版本
echo - **Linux**: 现代 Linux 发行版 ^(Ubuntu 18.04+, Fedora 32+, 等^)
) > RELEASE_NOTES.md

echo [SUCCESS] Release notes generated in RELEASE_NOTES.md
echo [INFO] Please review and update the release notes on GitHub if needed.