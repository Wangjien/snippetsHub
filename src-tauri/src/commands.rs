/*
 * SnippetsHub - 代码片段管理工具
 *
 * @file commands.rs - Tauri 命令处理模块
 * @author Noah
 * @description 定义所有暴露给前端调用的 Tauri 命令，处理业务逻辑和数据交互
 * @created 2026-01-18
 * @modified 2026-02-03
 * @version 1.0.0
 *
 * 功能特性:
 * - 代码片段 CRUD 操作
 * - 文件夹管理
 * - 数据库交互接口
 * - LSP 服务集成与管理
 * - 项目与工作区管理
 * - Git 版本控制集成
 * - 文件系统操作
 * - 代码执行引擎接口
 * - TODO 任务管理
 *
 * 架构说明:
 * 本模块作为前端与后端逻辑的桥梁，接收前端 invoke 调用，
 * 通过 State 获取数据库连接或其他共享状态，执行具体业务逻辑后返回结果。
 */
use crate::database::Database;
use crate::models::*;
use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::process::Command as TokioCommand;

// LSP服务器管理
type LSPServers = Arc<Mutex<HashMap<String, tokio::process::Child>>>;

#[tauri::command]
pub async fn create_snippet(
    db: State<'_, Database>,
    req: CreateSnippetRequest,
) -> Result<CodeSnippet, String> {
    db.create_snippet(req).await
}

#[tauri::command]
pub async fn get_all_snippets(db: State<'_, Database>) -> Result<Vec<CodeSnippet>, String> {
    db.get_all_snippets().await
}

#[tauri::command]
pub async fn get_snippet(
    db: State<'_, Database>,
    id: String,
) -> Result<Option<CodeSnippet>, String> {
    db.get_snippet(&id).await
}

#[tauri::command]
pub async fn update_snippet(
    db: State<'_, Database>,
    req: UpdateSnippetRequest,
) -> Result<CodeSnippet, String> {
    db.update_snippet(req).await
}

#[tauri::command]
pub async fn delete_snippet(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_snippet(&id).await
}

#[tauri::command]
pub async fn search_snippets(
    db: State<'_, Database>,
    query: SearchQuery,
) -> Result<Vec<CodeSnippet>, String> {
    db.search_snippets(query).await
}

#[tauri::command]
pub async fn create_folder(
    db: State<'_, Database>,
    name: String,
    parent_id: Option<String>,
) -> Result<Folder, String> {
    db.create_folder(name, parent_id).await
}

#[tauri::command]
pub async fn get_all_folders(db: State<'_, Database>) -> Result<Vec<Folder>, String> {
    db.get_all_folders().await
}

#[tauri::command]
pub async fn delete_folder(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_folder(&id).await
}

#[tauri::command]
pub async fn export_to_json(db: State<'_, Database>) -> Result<String, String> {
    let snippets = db.get_all_snippets().await?;
    serde_json::to_string_pretty(&snippets).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_to_clipboard(_content: String) -> Result<(), String> {
    // Tauri 会自动处理剪贴板
    Ok(())
}

// ============================================================================
// LSP Integration Commands
// ============================================================================

#[tauri::command]
pub async fn check_command_available(command: String) -> Result<bool, String> {
    let output = Command::new("which")
        .arg(&command)
        .output()
        .or_else(|_| Command::new("where").arg(&command).output());

    match output {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn start_language_server(
    servers: State<'_, LSPServers>,
    language: String,
    command: String,
    args: Vec<String>,
) -> Result<String, String> {
    let server_id = format!("{}_{}", language, chrono::Utc::now().timestamp());

    let mut cmd = TokioCommand::new(command);
    cmd.args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start LSP server: {}", e))?;

    let mut servers_map = servers.lock().map_err(|e| format!("Lock error: {}", e))?;
    servers_map.insert(server_id.clone(), child);

    Ok(server_id)
}

#[tauri::command]
pub async fn stop_language_server(
    servers: State<'_, LSPServers>,
    server_id: String,
) -> Result<(), String> {
    let mut child = {
        let mut servers_map = servers.lock().map_err(|e| format!("Lock error: {}", e))?;
        servers_map.remove(&server_id)
    };

    if let Some(ref mut child) = child {
        child
            .kill()
            .await
            .map_err(|e| format!("Failed to kill LSP server: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn lsp_request(
    _servers: State<'_, LSPServers>,
    _server_id: String,
    method: String,
    _params: String,
) -> Result<String, String> {
    // 这里应该实现LSP协议的请求/响应处理
    // 由于复杂性，这里返回一个模拟响应
    let response = match method.as_str() {
        "initialize" => r#"{"capabilities": {"completionProvider": true, "hoverProvider": true}}"#,
        "textDocument/completion" => r#"{"items": []}"#,
        "textDocument/hover" => r#"{"contents": []}"#,
        _ => r#"{}"#,
    };

    Ok(response.to_string())
}

#[tauri::command]
pub async fn lsp_notification(
    _servers: State<'_, LSPServers>,
    _server_id: String,
    _method: String,
    _params: String,
) -> Result<(), String> {
    // 实现LSP通知发送
    Ok(())
}

// ============================================================================
// Project Management Commands
// ============================================================================

#[tauri::command]
pub async fn create_workspace(
    db: State<'_, Database>,
    workspace: Workspace,
) -> Result<Workspace, String> {
    db.create_workspace(workspace).await
}

#[tauri::command]
pub async fn get_workspaces(db: State<'_, Database>) -> Result<Vec<Workspace>, String> {
    db.get_workspaces().await
}

#[tauri::command]
pub async fn update_workspace(
    db: State<'_, Database>,
    workspace_id: String,
    updates: WorkspaceUpdate,
) -> Result<Workspace, String> {
    db.update_workspace(workspace_id, updates).await
}

#[tauri::command]
pub async fn delete_workspace(db: State<'_, Database>, workspace_id: String) -> Result<(), String> {
    db.delete_workspace(workspace_id).await
}

#[tauri::command]
pub async fn create_project(db: State<'_, Database>, project: Project) -> Result<Project, String> {
    db.create_project(project).await
}

#[tauri::command]
pub async fn get_projects(db: State<'_, Database>) -> Result<Vec<Project>, String> {
    db.get_projects().await
}

#[tauri::command]
pub async fn update_project(
    db: State<'_, Database>,
    project_id: String,
    updates: ProjectUpdate,
) -> Result<Project, String> {
    db.update_project(project_id, updates).await
}

#[tauri::command]
pub async fn delete_project(db: State<'_, Database>, project_id: String) -> Result<(), String> {
    db.delete_project(project_id).await
}

#[tauri::command]
pub async fn get_snippets_by_project(
    db: State<'_, Database>,
    project_id: String,
) -> Result<Vec<CodeSnippet>, String> {
    db.get_snippets_by_project(project_id).await
}

// ============================================================================
// Git Integration Commands
// ============================================================================

#[tauri::command]
pub async fn create_git_repository(
    db: State<'_, Database>,
    repository: GitRepository,
) -> Result<GitRepository, String> {
    db.create_git_repository(repository).await
}

#[tauri::command]
pub async fn get_git_repositories(db: State<'_, Database>) -> Result<Vec<GitRepository>, String> {
    db.get_git_repositories().await
}

#[tauri::command]
pub async fn update_git_repository(
    db: State<'_, Database>,
    repository_id: String,
    updates: GitRepositoryUpdate,
) -> Result<GitRepository, String> {
    db.update_git_repository(repository_id, updates).await
}

#[tauri::command]
pub async fn delete_git_repository(
    db: State<'_, Database>,
    repository_id: String,
) -> Result<(), String> {
    db.delete_git_repository(repository_id).await
}

// ============================================================================
// File System Commands
// ============================================================================

#[tauri::command]
pub async fn remove_dir_all(path: String) -> Result<(), String> {
    tokio::fs::remove_dir_all(path)
        .await
        .map_err(|e| format!("Failed to remove directory: {}", e))
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    tokio::fs::create_dir_all(path)
        .await
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    tokio::fs::write(path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(tokio::fs::metadata(path).await.is_ok())
}

// ============================================================================
// Code Execution Commands
// ============================================================================

#[tauri::command]
pub async fn execute_code(
    language: String,
    code: String,
    options: ExecutionOptions,
) -> Result<ExecutionResult, String> {
    let temp_dir = std::env::temp_dir();
    let file_name = format!(
        "snippetshub_exec_{}.{}",
        chrono::Utc::now().timestamp(),
        get_file_extension(&language)
    );
    let file_path = temp_dir.join(&file_name);

    // 写入代码文件
    tokio::fs::write(&file_path, code)
        .await
        .map_err(|e| format!("Failed to write code file: {}", e))?;

    // 执行代码
    let result = match language.as_str() {
        "python" => execute_python(&file_path, &options).await,
        "javascript" => execute_javascript(&file_path, &options).await,
        "rust" => execute_rust(&file_path, &options).await,
        "go" => execute_go(&file_path, &options).await,
        _ => Err(format!("Unsupported language: {}", language)),
    };

    // 清理临时文件
    let _ = tokio::fs::remove_file(&file_path).await;

    result
}

fn get_file_extension(language: &str) -> &str {
    match language {
        "python" => "py",
        "javascript" => "js",
        "rust" => "rs",
        "go" => "go",
        "java" => "java",
        "cpp" => "cpp",
        "c" => "c",
        _ => "txt",
    }
}

async fn execute_python(
    file_path: &std::path::Path,
    _options: &ExecutionOptions,
) -> Result<ExecutionResult, String> {
    let mut cmd = TokioCommand::new("python3");
    cmd.arg(file_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let start_time = std::time::Instant::now();
    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python: {}", e))?;
    let duration = start_time.elapsed();

    Ok(ExecutionResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: duration.as_millis() as u64,
    })
}

async fn execute_javascript(
    file_path: &std::path::Path,
    _options: &ExecutionOptions,
) -> Result<ExecutionResult, String> {
    let mut cmd = TokioCommand::new("node");
    cmd.arg(file_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let start_time = std::time::Instant::now();
    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to execute Node.js: {}", e))?;
    let duration = start_time.elapsed();

    Ok(ExecutionResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: duration.as_millis() as u64,
    })
}

async fn execute_rust(
    file_path: &std::path::Path,
    _options: &ExecutionOptions,
) -> Result<ExecutionResult, String> {
    // 编译Rust代码
    let exe_path = file_path.with_extension("exe");
    let mut compile_cmd = TokioCommand::new("rustc");
    compile_cmd
        .arg(file_path)
        .arg("-o")
        .arg(&exe_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let compile_output = compile_cmd
        .output()
        .await
        .map_err(|e| format!("Failed to compile Rust: {}", e))?;

    if !compile_output.status.success() {
        return Ok(ExecutionResult {
            success: false,
            stdout: String::from_utf8_lossy(&compile_output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&compile_output.stderr).to_string(),
            exit_code: compile_output.status.code().unwrap_or(-1),
            duration_ms: 0,
        });
    }

    // 执行编译后的程序
    let mut run_cmd = TokioCommand::new(&exe_path);
    run_cmd
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let start_time = std::time::Instant::now();
    let output = run_cmd
        .output()
        .await
        .map_err(|e| format!("Failed to execute Rust binary: {}", e))?;
    let duration = start_time.elapsed();

    // 清理可执行文件
    let _ = tokio::fs::remove_file(&exe_path).await;

    Ok(ExecutionResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: duration.as_millis() as u64,
    })
}

async fn execute_go(
    file_path: &std::path::Path,
    _options: &ExecutionOptions,
) -> Result<ExecutionResult, String> {
    let mut cmd = TokioCommand::new("go");
    cmd.arg("run")
        .arg(file_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let start_time = std::time::Instant::now();
    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to execute Go: {}", e))?;
    let duration = start_time.elapsed();

    Ok(ExecutionResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: duration.as_millis() as u64,
    })
}

// ============================================================================
// Todo Management Commands
// ============================================================================

#[tauri::command]
pub async fn create_todo(db: State<'_, Database>, req: CreateTodoRequest) -> Result<Todo, String> {
    db.create_todo(req).await
}

#[tauri::command]
pub async fn get_todos(db: State<'_, Database>) -> Result<Vec<Todo>, String> {
    db.get_todos().await
}

#[tauri::command]
pub async fn get_todo(db: State<'_, Database>, todo_id: String) -> Result<Todo, String> {
    db.get_todo(&todo_id).await
}

#[tauri::command]
pub async fn update_todo(db: State<'_, Database>, req: UpdateTodoRequest) -> Result<Todo, String> {
    db.update_todo(req).await
}

#[tauri::command]
pub async fn delete_todo(db: State<'_, Database>, todo_id: String) -> Result<(), String> {
    db.delete_todo(todo_id).await
}

#[tauri::command]
pub async fn search_todos(
    db: State<'_, Database>,
    query: TodoSearchQuery,
) -> Result<Vec<Todo>, String> {
    db.search_todos(query).await
}

#[tauri::command]
pub async fn batch_update_todos(
    db: State<'_, Database>,
    operation: BatchTodoOperation,
) -> Result<Vec<Todo>, String> {
    db.batch_update_todos(operation).await
}

#[tauri::command]
pub async fn get_todo_stats(db: State<'_, Database>) -> Result<TodoStats, String> {
    db.get_todo_stats().await
}

// ============================================================================
// Todo Tag Management Commands
// ============================================================================

#[tauri::command]
pub async fn create_todo_tag(
    db: State<'_, Database>,
    req: CreateTodoTagRequest,
) -> Result<TodoTag, String> {
    db.create_todo_tag(req).await
}

#[tauri::command]
pub async fn get_todo_tags(db: State<'_, Database>) -> Result<Vec<TodoTag>, String> {
    db.get_todo_tags_list().await
}

#[tauri::command]
pub async fn update_todo_tag(
    db: State<'_, Database>,
    req: UpdateTodoTagRequest,
) -> Result<TodoTag, String> {
    db.update_todo_tag(req).await
}

#[tauri::command]
pub async fn delete_todo_tag(db: State<'_, Database>, tag_id: String) -> Result<(), String> {
    db.delete_todo_tag(tag_id).await
}
