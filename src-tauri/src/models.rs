/*
 * SnippetsHub - 专业代码片段管理工具
 *
 * @file models.rs - 数据模型定义
 * @author Noah
 * @description 定义应用程序中使用的所有数据结构和类型
 * @created 2026-01-07
 * @modified 2026-01-29
 * @version 1.0.0
 *
 * 功能特性:
 * - 代码片段数据模型
 * - 文件夹层级结构
 * - TODO任务模型
 * - 请求/响应数据传输对象
 * - 搜索查询参数
 * - 序列化和反序列化支持
 * - 类型安全的数据验证
 *
 * 主要数据结构:
 * - CodeSnippet: 代码片段核心数据
 * - Folder: 文件夹组织结构
 * - Todo: 任务管理数据
 * - 各种Request/Response类型
 *
 * 使用示例:
 * ```rust
 * let snippet = CodeSnippet {
 *     id: "snippet_123".to_string(),
 *     title: "快速排序算法".to_string(),
 *     language: "rust".to_string(),
 *     // ... 其他字段
 * };
 * ```
 */
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 代码片段数据模型
///
/// 包含代码片段的所有核心信息，包括元数据、内容和组织结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSnippet {
    /// 唯一标识符
    pub id: String,
    /// 片段标题
    pub title: String,
    /// 详细描述
    pub description: String,
    /// 代码内容
    pub code: String,
    /// 编程语言
    pub language: String,
    /// 标签列表
    pub tags: Vec<String>,
    /// 所属文件夹ID
    pub folder_id: Option<String>,
    /// 所属项目ID
    pub project_id: Option<String>,
    /// 是否收藏
    pub is_favorite: bool,
    /// 使用次数
    pub usage_count: i64,
    /// 创建时间戳
    pub created_at: i64,
    /// 更新时间戳
    pub updated_at: i64,
}

/// 文件夹数据模型
///
/// 用于组织代码片段的层级结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    /// 文件夹唯一标识符
    pub id: String,
    /// 文件夹名称
    pub name: String,
    /// 父文件夹ID（支持嵌套）
    pub parent_id: Option<String>,
    /// 创建时间戳
    pub created_at: i64,
}

/// 创建代码片段请求数据
///
/// 用于前端向后端发送创建代码片段的请求
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSnippetRequest {
    pub title: String,
    pub description: String,
    pub code: String,
    pub language: String,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
    pub project_id: Option<String>,
}

/// 更新代码片段请求数据
///
/// 用于前端向后端发送更新代码片段的请求
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateSnippetRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub code: Option<String>,
    pub language: Option<String>,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub project_id: Option<String>,
    pub is_favorite: Option<bool>,
    pub usage_count: Option<i64>,
}

/// 搜索查询参数
///
/// 定义全文搜索和过滤的参数结构
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchQuery {
    pub keyword: String,
    pub tags: Option<Vec<String>>,
    pub language: Option<String>,
}

// ============================================================================
// Todo Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Todo {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,           // 'todo', 'in_progress', 'blocked', 'completed'
    pub priority: Option<String>, // 'high', 'medium', 'low'
    pub due_date: Option<String>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
    pub progress: i32, // 0-100
    pub assignee: Option<String>,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub recurring_config: Option<String>, // JSON
    pub dependencies: Vec<String>,
    pub completed: bool,
    pub archived: bool,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub archived_at: Option<i64>,
    pub tags: Vec<String>,   // Will be populated from relations
    pub subtasks: Vec<Todo>, // Will be populated for hierarchical display
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoTag {
    pub id: String,
    pub name: String,
    pub color: String,
    pub bg_color: String,
    pub color_id: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTodoRequest {
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub estimated_hours: Option<f64>,
    pub assignee: Option<String>,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub recurring_config: Option<String>,
    pub dependencies: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTodoRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
    pub progress: Option<i32>,
    pub assignee: Option<String>,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub recurring_config: Option<String>,
    pub dependencies: Option<Vec<String>>,
    pub completed: Option<bool>,
    pub archived: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTodoTagRequest {
    pub name: String,
    pub color_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTodoTagRequest {
    pub id: String,
    pub name: Option<String>,
    pub color_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TodoSearchQuery {
    pub keyword: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub tags: Option<Vec<String>>,
    pub assignee: Option<String>,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub due_date_from: Option<String>,
    pub due_date_to: Option<String>,
    pub completed: Option<bool>,
    pub archived: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchTodoOperation {
    pub todo_ids: Vec<String>,
    pub operation: String, // 'update', 'delete', 'complete', 'archive'
    pub updates: Option<UpdateTodoRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoComment {
    pub id: String,
    pub todo_id: String,
    pub content: String,
    pub author: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoAttachment {
    pub id: String,
    pub todo_id: String,
    pub filename: String,
    pub filepath: String,
    pub size: Option<i64>,
    pub mime_type: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoStats {
    pub total: i64,
    pub completed: i64,
    pub pending: i64,
    pub in_progress: i64,
    pub blocked: i64,
    pub overdue: i64,
    pub due_today: i64,
    pub due_this_week: i64,
    pub by_priority: HashMap<String, i64>,
    pub by_project: HashMap<String, i64>,
    pub by_assignee: HashMap<String, i64>,
}

// ============================================================================
// Workspace and Project Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub is_default: bool,
    pub settings: HashMap<String, serde_json::Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub is_default: Option<bool>,
    pub settings: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub description: String,
    pub project_type: String,
    pub template: Option<String>,
    pub parent_id: Option<String>,
    pub path: String,
    pub color: String,
    pub icon: String,
    pub tags: Vec<String>,
    pub settings: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub is_folder: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub project_type: Option<String>,
    pub parent_id: Option<String>,
    pub path: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub tags: Option<Vec<String>>,
    pub settings: Option<HashMap<String, serde_json::Value>>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub is_folder: Option<bool>,
}

// ============================================================================
// Git Integration Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepository {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub is_default: bool,
    pub remotes: Vec<GitRemote>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRemote {
    pub name: String,
    pub url: String,
    pub fetch_url: Option<String>,
    pub push_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitRepositoryUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub path: Option<String>,
    pub is_default: Option<bool>,
    pub remotes: Option<Vec<GitRemote>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: String,
    pub message: String,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub full_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
    pub modified: bool,
    pub untracked: bool,
    pub deleted: bool,
    pub renamed: bool,
    pub copied: bool,
}

// ============================================================================
// Code Execution Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionOptions {
    pub timeout: Option<u64>,
    pub memory_limit: Option<String>,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub input: Option<String>,
    pub working_dir: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeInfo {
    pub language: String,
    pub name: String,
    pub version: String,
    pub command: String,
    pub extension: String,
    pub available: bool,
}

// ============================================================================
// LSP Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct LSPRequest {
    pub id: String,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LSPResponse {
    pub id: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<LSPError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LSPError {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LSPNotification {
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionItem {
    pub label: String,
    pub kind: Option<i32>,
    pub detail: Option<String>,
    pub documentation: Option<String>,
    pub insert_text: Option<String>,
    pub insert_text_format: Option<i32>,
    pub sort_text: Option<String>,
    pub filter_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HoverInfo {
    pub contents: Vec<String>,
    pub range: Option<LSPRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPRange {
    pub start: LSPPosition,
    pub end: LSPPosition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPPosition {
    pub line: u32,
    pub character: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Diagnostic {
    pub range: LSPRange,
    pub severity: Option<i32>,
    pub code: Option<String>,
    pub source: Option<String>,
    pub message: String,
    pub related_information: Option<Vec<DiagnosticRelatedInformation>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticRelatedInformation {
    pub location: LSPLocation,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPLocation {
    pub uri: String,
    pub range: LSPRange,
}
