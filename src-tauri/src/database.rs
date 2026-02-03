/*
 * SnippetsHub - 专业代码片段管理工具
 *
 * @file database.rs - 数据库操作模块
 * @author Noah
 * @description SQLite数据库的核心操作模块，提供完整的数据持久化功能
 * @created 2026-01-09
 * @modified 2026-01-29
 * @version 1.0.0
 *
 * 功能特性:
 * - SQLite数据库连接和管理
 * - 代码片段的CRUD操作
 * - FTS5全文搜索引擎
 * - 文件夹层级管理
 * - TODO任务数据管理
 * - 数据库迁移和版本控制
 * - 事务处理和错误恢复
 * - 性能优化和索引管理
 *
 * 数据库架构:
 * - snippets: 代码片段主表
 * - folders: 文件夹组织结构
 * - todos: TODO任务管理
 * - snippet_fts: 全文搜索索引
 *
 * 使用示例:
 * ```rust
 * let db = Database::new(&app_handle).await?;
 * let snippet = db.create_snippet(snippet_data).await?;
 * let results = db.search_snippets("javascript").await?;
 * ```
 */
use crate::models::*;
// database.rs
//
// 后端数据库操作模块
// 提供了与 SQLite 数据库交互的所有核心功能，包括：
// - 数据库初始化 (Migration)
// - Snippets 的增删改查
// - FTS5 全文搜索实现
// - 文件夹管理

use sqlx::{Row, SqlitePool};
use std::collections::HashMap;

use tauri::{AppHandle, Manager};
use tokio::fs;

#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;

        if !app_dir.exists() {
            fs::create_dir_all(&app_dir)
                .await
                .map_err(|e| e.to_string())?;
        }

        let db_path = app_dir.join("snippets_hub.sqlite");
        let db_url = format!("sqlite:{}", db_path.to_string_lossy());

        // Create database file if not exists
        if !db_path.exists() {
            std::fs::File::create(&db_path).map_err(|e| e.to_string())?;
        }

        let pool = SqlitePool::connect(&db_url)
            .await
            .map_err(|e| format!("Failed to connect to database: {}", e))?;

        let db = Database { pool };
        db.init_schema().await?;

        Ok(db)
    }

    async fn init_schema(&self) -> Result<(), String> {
        // Snippets Table (updated with project_id and is_favorite)
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS snippets (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                code TEXT NOT NULL,
                language TEXT NOT NULL,
                tags TEXT, -- JSON array
                folder_id TEXT,
                project_id TEXT,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                usage_count INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Add is_favorite column if it doesn't exist (migration)
        sqlx::query("ALTER TABLE snippets ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0")
            .execute(&self.pool)
            .await
            .ok(); // Ignore error if column already exists

        // Add usage_count column if it doesn't exist (migration)
        sqlx::query("ALTER TABLE snippets ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0")
            .execute(&self.pool)
            .await
            .ok(); // Ignore error if column already exists

        // Folders Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                created_at INTEGER NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Workspaces Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT NOT NULL,
                is_default INTEGER NOT NULL DEFAULT 0,
                settings TEXT, -- JSON object
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Projects Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                project_type TEXT NOT NULL,
                template TEXT,
                parent_id TEXT,
                path TEXT NOT NULL,
                color TEXT NOT NULL,
                icon TEXT NOT NULL,
                tags TEXT, -- JSON array
                settings TEXT, -- JSON object
                metadata TEXT, -- JSON object
                is_folder INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Git Repositories Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS git_repositories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                path TEXT NOT NULL UNIQUE,
                is_default INTEGER NOT NULL DEFAULT 0,
                remotes TEXT, -- JSON array
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // FTS Table
        sqlx::query(
            "CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
                id UNINDEXED,
                title,
                description,
                code,
                tags,
                tokenize='trigram'
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Triggers to keep FTS updated
        sqlx::query(
            "CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets BEGIN
              INSERT INTO snippets_fts(id, title, description, code, tags) 
              VALUES (new.id, new.title, new.description, new.code, new.tags);
            END;",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets BEGIN
              DELETE FROM snippets_fts WHERE id = old.id;
            END;",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets BEGIN
              UPDATE snippets_fts SET 
                title = new.title, 
                description = new.description, 
                code = new.code, 
                tags = new.tags
              WHERE id = old.id;
            END;",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Todos Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo',
                priority TEXT,
                due_date TEXT,
                estimated_hours REAL,
                actual_hours REAL,
                progress INTEGER DEFAULT 0,
                assignee TEXT,
                project_id TEXT,
                parent_id TEXT,
                recurring_config TEXT, -- JSON
                dependencies TEXT, -- JSON array
                completed BOOLEAN DEFAULT FALSE,
                archived BOOLEAN DEFAULT FALSE,
                created_by TEXT,
                updated_by TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                archived_at INTEGER
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Todo Tags Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS todo_tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                bg_color TEXT NOT NULL,
                color_id TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Todo Tag Relations Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS todo_tag_relations (
                todo_id TEXT,
                tag_id TEXT,
                PRIMARY KEY (todo_id, tag_id),
                FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES todo_tags(id) ON DELETE CASCADE
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Todo Comments Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS todo_comments (
                id TEXT PRIMARY KEY,
                todo_id TEXT NOT NULL,
                content TEXT NOT NULL,
                author TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Todo Attachments Table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS todo_attachments (
                id TEXT PRIMARY KEY,
                todo_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                size INTEGER,
                mime_type TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
            )",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Add indexes for better performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_snippets_project_id ON snippets(project_id)")
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id)")
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id)")
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)")
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)")
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn create_snippet(&self, req: CreateSnippetRequest) -> Result<CodeSnippet, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let tags_json = serde_json::to_string(&req.tags).unwrap_or("[]".to_string());

        sqlx::query(
            "INSERT INTO snippets (id, title, description, code, language, tags, folder_id, project_id, is_favorite, usage_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.code)
        .bind(&req.language)
        .bind(&tags_json)
        .bind(&req.folder_id)
        .bind(&req.project_id)
        .bind(0) // is_favorite default to false
        .bind(0) // usage_count default to 0
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(CodeSnippet {
            id,
            title: req.title,
            description: req.description,
            code: req.code,
            language: req.language,
            tags: req.tags,
            folder_id: req.folder_id,
            project_id: req.project_id,
            is_favorite: false,
            usage_count: 0,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn get_all_snippets(&self) -> Result<Vec<CodeSnippet>, String> {
        let rows = sqlx::query("SELECT * FROM snippets ORDER BY updated_at DESC")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        let mut snippets = Vec::new();
        for row in rows {
            let tags_str: String = row.get("tags");
            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

            snippets.push(CodeSnippet {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                code: row.get("code"),
                language: row.get("language"),
                tags,
                folder_id: row.get("folder_id"),
                project_id: row.get("project_id"),
                is_favorite: row.try_get("is_favorite").unwrap_or(0) != 0,
                usage_count: row.try_get("usage_count").unwrap_or(0),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }
        Ok(snippets)
    }

    pub async fn get_snippet(&self, id: &str) -> Result<Option<CodeSnippet>, String> {
        let row = sqlx::query("SELECT * FROM snippets WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(row) = row {
            let tags_str: String = row.get("tags");
            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

            Ok(Some(CodeSnippet {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                code: row.get("code"),
                language: row.get("language"),
                tags,
                folder_id: row.get("folder_id"),
                project_id: row.get("project_id"),
                is_favorite: row.try_get("is_favorite").unwrap_or(0) != 0,
                usage_count: row.try_get("usage_count").unwrap_or(0),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_snippet(&self, req: UpdateSnippetRequest) -> Result<CodeSnippet, String> {
        let now = chrono::Utc::now().timestamp();

        // First get the current snippet to fill in missing fields
        let current = self
            .get_snippet(&req.id)
            .await?
            .ok_or_else(|| "Snippet not found".to_string())?;

        // Use provided values or fall back to current values
        let title = req.title.unwrap_or(current.title);
        let description = req.description.unwrap_or(current.description);
        let code = req.code.unwrap_or(current.code);
        let language = req.language.unwrap_or(current.language);
        let tags = req.tags.unwrap_or(current.tags);
        let folder_id = req.folder_id.or(current.folder_id);
        let project_id = req.project_id.or(current.project_id);
        let is_favorite = req.is_favorite.unwrap_or(current.is_favorite);
        let usage_count = req.usage_count.unwrap_or(current.usage_count);

        let tags_json = serde_json::to_string(&tags).unwrap_or("[]".to_string());

        sqlx::query(
            "UPDATE snippets SET title = ?, description = ?, code = ?, language = ?, tags = ?, folder_id = ?, project_id = ?, is_favorite = ?, usage_count = ?, updated_at = ? WHERE id = ?"
        )
        .bind(&title)
        .bind(&description)
        .bind(&code)
        .bind(&language)
        .bind(&tags_json)
        .bind(&folder_id)
        .bind(&project_id)
        .bind(if is_favorite { 1 } else { 0 })
        .bind(usage_count)
        .bind(now)
        .bind(&req.id)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(CodeSnippet {
            id: req.id,
            title,
            description,
            code,
            language,
            tags,
            folder_id,
            project_id,
            is_favorite,
            usage_count,
            created_at: current.created_at,
            updated_at: now,
        })
    }

    pub async fn delete_snippet(&self, id: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM snippets WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn search_snippets(&self, query: SearchQuery) -> Result<Vec<CodeSnippet>, String> {
        let mut sql = String::from("SELECT * FROM snippets WHERE 1=1");
        let mut conditions = Vec::new();

        if !query.keyword.is_empty() {
            conditions.push(format!(
                "(title LIKE '%{}%' OR description LIKE '%{}%' OR code LIKE '%{}%')",
                query.keyword, query.keyword, query.keyword
            ));
        }

        if let Some(language) = &query.language {
            conditions.push(format!("language = '{}'", language));
        }

        if let Some(tags) = &query.tags {
            for tag in tags {
                conditions.push(format!("tags LIKE '%{}%'", tag));
            }
        }

        if !conditions.is_empty() {
            sql.push_str(" AND ");
            sql.push_str(&conditions.join(" AND "));
        }

        sql.push_str(" ORDER BY updated_at DESC");

        let rows = sqlx::query(&sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        let mut snippets = Vec::new();
        for row in rows {
            let tags_str: String = row.get("tags");
            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

            snippets.push(CodeSnippet {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                code: row.get("code"),
                language: row.get("language"),
                tags,
                folder_id: row.get("folder_id"),
                project_id: row.get("project_id"),
                is_favorite: row.try_get("is_favorite").unwrap_or(0) != 0,
                usage_count: row.try_get("usage_count").unwrap_or(0),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }
        Ok(snippets)
    }

    pub async fn create_folder(
        &self,
        name: String,
        parent_id: Option<String>,
    ) -> Result<Folder, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query("INSERT INTO folders (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)")
            .bind(&id)
            .bind(&name)
            .bind(&parent_id)
            .bind(now)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Folder {
            id,
            name,
            parent_id,
            created_at: now,
        })
    }

    pub async fn get_all_folders(&self) -> Result<Vec<Folder>, String> {
        let rows = sqlx::query("SELECT * FROM folders ORDER BY created_at ASC")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        let mut folders = Vec::new();
        for row in rows {
            folders.push(Folder {
                id: row.get("id"),
                name: row.get("name"),
                parent_id: row.get("parent_id"),
                created_at: row.get("created_at"),
            });
        }
        Ok(folders)
    }

    pub async fn delete_folder(&self, id: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM folders WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("UPDATE snippets SET folder_id = NULL WHERE folder_id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    // ============================================================================
    // Workspace Management
    // ============================================================================

    pub async fn create_workspace(&self, workspace: Workspace) -> Result<Workspace, String> {
        let settings_json = serde_json::to_string(&workspace.settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        sqlx::query(
            "INSERT INTO workspaces (id, name, description, color, is_default, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&workspace.id)
        .bind(&workspace.name)
        .bind(&workspace.description)
        .bind(&workspace.color)
        .bind(workspace.is_default)
        .bind(&settings_json)
        .bind(&workspace.created_at)
        .bind(&workspace.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to create workspace: {}", e))?;

        Ok(workspace)
    }

    pub async fn get_workspaces(&self) -> Result<Vec<Workspace>, String> {
        let rows = sqlx::query(
            "SELECT id, name, description, color, is_default, settings, created_at, updated_at FROM workspaces ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get workspaces: {}", e))?;

        let mut workspaces = Vec::new();
        for row in rows {
            let settings_str: String = row.get("settings");
            let settings: std::collections::HashMap<String, serde_json::Value> =
                serde_json::from_str(&settings_str).unwrap_or_default();

            workspaces.push(Workspace {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                color: row.get("color"),
                is_default: row.get::<i32, _>("is_default") != 0,
                settings,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(workspaces)
    }

    pub async fn update_workspace(
        &self,
        workspace_id: String,
        _updates: WorkspaceUpdate,
    ) -> Result<Workspace, String> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query("UPDATE workspaces SET updated_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&workspace_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update workspace: {}", e))?;

        self.get_workspace(&workspace_id).await
    }

    pub async fn get_workspace(&self, workspace_id: &str) -> Result<Workspace, String> {
        let row = sqlx::query(
            "SELECT id, name, description, color, is_default, settings, created_at, updated_at FROM workspaces WHERE id = ?"
        )
        .bind(workspace_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get workspace: {}", e))?;

        let settings_str: String = row.get("settings");
        let settings: std::collections::HashMap<String, serde_json::Value> =
            serde_json::from_str(&settings_str).unwrap_or_default();

        Ok(Workspace {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            color: row.get("color"),
            is_default: row.get::<i32, _>("is_default") != 0,
            settings,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }

    pub async fn delete_workspace(&self, workspace_id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM workspaces WHERE id = ?")
            .bind(&workspace_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete workspace: {}", e))?;

        Ok(())
    }

    // ============================================================================
    // Project Management
    // ============================================================================

    pub async fn create_project(&self, project: Project) -> Result<Project, String> {
        let settings_json = serde_json::to_string(&project.settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;
        let metadata_json = serde_json::to_string(&project.metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        let tags_json = serde_json::to_string(&project.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;

        sqlx::query(
            "INSERT INTO projects (id, workspace_id, name, description, project_type, template, parent_id, path, color, icon, tags, settings, metadata, is_folder, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&project.id)
        .bind(&project.workspace_id)
        .bind(&project.name)
        .bind(&project.description)
        .bind(&project.project_type)
        .bind(&project.template)
        .bind(&project.parent_id)
        .bind(&project.path)
        .bind(&project.color)
        .bind(&project.icon)
        .bind(&tags_json)
        .bind(&settings_json)
        .bind(&metadata_json)
        .bind(project.is_folder)
        .bind(&project.created_at)
        .bind(&project.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to create project: {}", e))?;

        Ok(project)
    }

    pub async fn get_projects(&self) -> Result<Vec<Project>, String> {
        let rows = sqlx::query(
            "SELECT id, workspace_id, name, description, project_type, template, parent_id, path, color, icon, tags, settings, metadata, is_folder, created_at, updated_at FROM projects ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get projects: {}", e))?;

        let mut projects = Vec::new();
        for row in rows {
            let tags_str: String = row.get("tags");
            let settings_str: String = row.get("settings");
            let metadata_str: String = row.get("metadata");

            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
            let settings: std::collections::HashMap<String, serde_json::Value> =
                serde_json::from_str(&settings_str).unwrap_or_default();
            let metadata: std::collections::HashMap<String, serde_json::Value> =
                serde_json::from_str(&metadata_str).unwrap_or_default();

            projects.push(Project {
                id: row.get("id"),
                workspace_id: row.get("workspace_id"),
                name: row.get("name"),
                description: row.get("description"),
                project_type: row.get("project_type"),
                template: row.get("template"),
                parent_id: row.get("parent_id"),
                path: row.get("path"),
                color: row.get("color"),
                icon: row.get("icon"),
                tags,
                settings,
                metadata,
                is_folder: row.get::<i32, _>("is_folder") != 0,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(projects)
    }

    pub async fn update_project(
        &self,
        project_id: String,
        _updates: ProjectUpdate,
    ) -> Result<Project, String> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query("UPDATE projects SET updated_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&project_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update project: {}", e))?;

        self.get_project(&project_id).await
    }

    pub async fn get_project(&self, project_id: &str) -> Result<Project, String> {
        let row = sqlx::query(
            "SELECT id, workspace_id, name, description, project_type, template, parent_id, path, color, icon, tags, settings, metadata, is_folder, created_at, updated_at FROM projects WHERE id = ?"
        )
        .bind(project_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get project: {}", e))?;

        let tags_str: String = row.get("tags");
        let settings_str: String = row.get("settings");
        let metadata_str: String = row.get("metadata");

        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
        let settings: std::collections::HashMap<String, serde_json::Value> =
            serde_json::from_str(&settings_str).unwrap_or_default();
        let metadata: std::collections::HashMap<String, serde_json::Value> =
            serde_json::from_str(&metadata_str).unwrap_or_default();

        Ok(Project {
            id: row.get("id"),
            workspace_id: row.get("workspace_id"),
            name: row.get("name"),
            description: row.get("description"),
            project_type: row.get("project_type"),
            template: row.get("template"),
            parent_id: row.get("parent_id"),
            path: row.get("path"),
            color: row.get("color"),
            icon: row.get("icon"),
            tags,
            settings,
            metadata,
            is_folder: row.get::<i32, _>("is_folder") != 0,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }

    pub async fn delete_project(&self, project_id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM projects WHERE id = ?")
            .bind(&project_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete project: {}", e))?;

        Ok(())
    }

    pub async fn get_snippets_by_project(
        &self,
        project_id: String,
    ) -> Result<Vec<CodeSnippet>, String> {
        let rows = sqlx::query(
            "SELECT id, title, description, code, language, tags, folder_id, project_id, created_at, updated_at FROM snippets WHERE project_id = ? ORDER BY updated_at DESC"
        )
        .bind(&project_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get snippets by project: {}", e))?;

        let mut snippets = Vec::new();
        for row in rows {
            let tags_str: String = row.get("tags");
            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

            snippets.push(CodeSnippet {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                code: row.get("code"),
                language: row.get("language"),
                tags,
                folder_id: row.get("folder_id"),
                project_id: row.get("project_id"),
                is_favorite: row.try_get("is_favorite").unwrap_or(0) != 0,
                usage_count: row.try_get("usage_count").unwrap_or(0),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(snippets)
    }

    // ============================================================================
    // Git Repository Management
    // ============================================================================

    pub async fn create_git_repository(
        &self,
        repository: GitRepository,
    ) -> Result<GitRepository, String> {
        let remotes_json = serde_json::to_string(&repository.remotes)
            .map_err(|e| format!("Failed to serialize remotes: {}", e))?;

        sqlx::query(
            "INSERT INTO git_repositories (id, name, description, path, is_default, remotes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&repository.id)
        .bind(&repository.name)
        .bind(&repository.description)
        .bind(&repository.path)
        .bind(repository.is_default)
        .bind(&remotes_json)
        .bind(&repository.created_at)
        .bind(&repository.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to create git repository: {}", e))?;

        Ok(repository)
    }

    pub async fn get_git_repositories(&self) -> Result<Vec<GitRepository>, String> {
        let rows = sqlx::query(
            "SELECT id, name, description, path, is_default, remotes, created_at, updated_at FROM git_repositories ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get git repositories: {}", e))?;

        let mut repositories = Vec::new();
        for row in rows {
            let remotes_str: String = row.get("remotes");
            let remotes: Vec<GitRemote> = serde_json::from_str(&remotes_str).unwrap_or_default();

            repositories.push(GitRepository {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                path: row.get("path"),
                is_default: row.get::<i32, _>("is_default") != 0,
                remotes,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(repositories)
    }

    pub async fn update_git_repository(
        &self,
        repository_id: String,
        _updates: GitRepositoryUpdate,
    ) -> Result<GitRepository, String> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query("UPDATE git_repositories SET updated_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&repository_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update git repository: {}", e))?;

        self.get_git_repository(&repository_id).await
    }

    pub async fn get_git_repository(&self, repository_id: &str) -> Result<GitRepository, String> {
        let row = sqlx::query(
            "SELECT id, name, description, path, is_default, remotes, created_at, updated_at FROM git_repositories WHERE id = ?"
        )
        .bind(repository_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get git repository: {}", e))?;

        let remotes_str: String = row.get("remotes");
        let remotes: Vec<GitRemote> = serde_json::from_str(&remotes_str).unwrap_or_default();

        Ok(GitRepository {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            path: row.get("path"),
            is_default: row.get::<i32, _>("is_default") != 0,
            remotes,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }

    pub async fn delete_git_repository(&self, repository_id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM git_repositories WHERE id = ?")
            .bind(&repository_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete git repository: {}", e))?;

        Ok(())
    }

    // ============================================================================
    // Todo Management
    // ============================================================================

    pub async fn create_todo(&self, req: CreateTodoRequest) -> Result<Todo, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let dependencies_json = serde_json::to_string(&req.dependencies.unwrap_or_default())
            .map_err(|e| format!("Failed to serialize dependencies: {}", e))?;

        sqlx::query(
            "INSERT INTO todos (id, title, description, status, priority, due_date, estimated_hours, assignee, project_id, parent_id, recurring_config, dependencies, completed, archived, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(req.status.as_deref().unwrap_or("todo"))
        .bind(&req.priority)
        .bind(&req.due_date)
        .bind(req.estimated_hours)
        .bind(&req.assignee)
        .bind(&req.project_id)
        .bind(&req.parent_id)
        .bind(&req.recurring_config)
        .bind(&dependencies_json)
        .bind(false)
        .bind(false)
        .bind(&req.assignee) // created_by
        .bind(&req.assignee) // updated_by
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to create todo: {}", e))?;

        // Add tag relations if provided
        if let Some(tags) = &req.tags {
            for tag_id in tags {
                sqlx::query(
                    "INSERT OR IGNORE INTO todo_tag_relations (todo_id, tag_id) VALUES (?, ?)",
                )
                .bind(&id)
                .bind(tag_id)
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to add tag relation: {}", e))?;
            }
        }

        self.get_todo(&id).await
    }

    pub async fn get_todos(&self) -> Result<Vec<Todo>, String> {
        let rows = sqlx::query(
            "SELECT id, title, description, status, priority, due_date, estimated_hours, actual_hours, progress, assignee, project_id, parent_id, recurring_config, dependencies, completed, archived, created_by, updated_by, created_at, updated_at, archived_at FROM todos ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get todos: {}", e))?;

        let mut todos = Vec::new();
        for row in rows {
            let dependencies_str: String = row.get("dependencies");
            let dependencies: Vec<String> =
                serde_json::from_str(&dependencies_str).unwrap_or_default();

            let todo_id: String = row.get("id");
            let tags = self.get_todo_tags(&todo_id).await?;
            let subtasks = self.get_subtasks(&todo_id).await?;

            todos.push(Todo {
                id: todo_id,
                title: row.get("title"),
                description: row.get("description"),
                status: row.get("status"),
                priority: row.get("priority"),
                due_date: row.get("due_date"),
                estimated_hours: row.get("estimated_hours"),
                actual_hours: row.get("actual_hours"),
                progress: row.get("progress"),
                assignee: row.get("assignee"),
                project_id: row.get("project_id"),
                parent_id: row.get("parent_id"),
                recurring_config: row.get("recurring_config"),
                dependencies,
                completed: row.get("completed"),
                archived: row.get("archived"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                archived_at: row.get("archived_at"),
                tags,
                subtasks,
            });
        }

        Ok(todos)
    }

    pub async fn get_todo(&self, todo_id: &str) -> Result<Todo, String> {
        let row = sqlx::query(
            "SELECT id, title, description, status, priority, due_date, estimated_hours, actual_hours, progress, assignee, project_id, parent_id, recurring_config, dependencies, completed, archived, created_by, updated_by, created_at, updated_at, archived_at FROM todos WHERE id = ?"
        )
        .bind(todo_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get todo: {}", e))?;

        let dependencies_str: String = row.get("dependencies");
        let dependencies: Vec<String> = serde_json::from_str(&dependencies_str).unwrap_or_default();

        let tags = self.get_todo_tags(todo_id).await?;
        let subtasks = self.get_subtasks(todo_id).await?;

        Ok(Todo {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            status: row.get("status"),
            priority: row.get("priority"),
            due_date: row.get("due_date"),
            estimated_hours: row.get("estimated_hours"),
            actual_hours: row.get("actual_hours"),
            progress: row.get("progress"),
            assignee: row.get("assignee"),
            project_id: row.get("project_id"),
            parent_id: row.get("parent_id"),
            recurring_config: row.get("recurring_config"),
            dependencies,
            completed: row.get("completed"),
            archived: row.get("archived"),
            created_by: row.get("created_by"),
            updated_by: row.get("updated_by"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            archived_at: row.get("archived_at"),
            tags,
            subtasks,
        })
    }

    pub async fn update_todo(&self, req: UpdateTodoRequest) -> Result<Todo, String> {
        let now = chrono::Utc::now().timestamp();

        // Simple approach: update all fields that are provided
        let mut sql_parts = Vec::new();

        if let Some(title) = &req.title {
            sql_parts.push(format!("title = '{}'", title.replace("'", "''")));
        }
        if let Some(description) = &req.description {
            sql_parts.push(format!(
                "description = '{}'",
                description.replace("'", "''")
            ));
        }
        if let Some(status) = &req.status {
            sql_parts.push(format!("status = '{}'", status.replace("'", "''")));
        }
        if let Some(priority) = &req.priority {
            sql_parts.push(format!("priority = '{}'", priority.replace("'", "''")));
        }
        if let Some(due_date) = &req.due_date {
            sql_parts.push(format!("due_date = '{}'", due_date.replace("'", "''")));
        }
        if let Some(estimated_hours) = req.estimated_hours {
            sql_parts.push(format!("estimated_hours = {}", estimated_hours));
        }
        if let Some(actual_hours) = req.actual_hours {
            sql_parts.push(format!("actual_hours = {}", actual_hours));
        }
        if let Some(progress) = req.progress {
            sql_parts.push(format!("progress = {}", progress));
        }
        if let Some(completed) = req.completed {
            sql_parts.push(format!("completed = {}", completed));
        }
        if let Some(archived) = req.archived {
            sql_parts.push(format!("archived = {}", archived));
            if archived {
                sql_parts.push(format!("archived_at = {}", now));
            }
        }

        sql_parts.push(format!("updated_at = {}", now));

        if !sql_parts.is_empty() {
            let sql = format!("UPDATE todos SET {} WHERE id = ?", sql_parts.join(", "));
            sqlx::query(&sql)
                .bind(&req.id)
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to update todo: {}", e))?;
        }

        // Update tags if provided
        if let Some(tags) = &req.tags {
            // Remove existing tag relations
            sqlx::query("DELETE FROM todo_tag_relations WHERE todo_id = ?")
                .bind(&req.id)
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to remove tag relations: {}", e))?;

            // Add new tag relations
            for tag_id in tags {
                sqlx::query("INSERT INTO todo_tag_relations (todo_id, tag_id) VALUES (?, ?)")
                    .bind(&req.id)
                    .bind(tag_id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to add tag relation: {}", e))?;
            }
        }

        self.get_todo(&req.id).await
    }

    pub async fn delete_todo(&self, todo_id: String) -> Result<(), String> {
        // Delete subtasks first
        sqlx::query("DELETE FROM todos WHERE parent_id = ?")
            .bind(&todo_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete subtasks: {}", e))?;

        // Delete the todo (tag relations will be deleted by CASCADE)
        sqlx::query("DELETE FROM todos WHERE id = ?")
            .bind(&todo_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete todo: {}", e))?;

        Ok(())
    }

    pub async fn search_todos(&self, query: TodoSearchQuery) -> Result<Vec<Todo>, String> {
        let mut sql = String::from("SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.estimated_hours, t.actual_hours, t.progress, t.assignee, t.project_id, t.parent_id, t.recurring_config, t.dependencies, t.completed, t.archived, t.created_by, t.updated_by, t.created_at, t.updated_at, t.archived_at FROM todos t");
        let mut joins = Vec::new();
        let mut conditions = Vec::new();

        if query.tags.is_some() {
            joins.push("LEFT JOIN todo_tag_relations ttr ON t.id = ttr.todo_id");
        }

        if let Some(keyword) = &query.keyword {
            if !keyword.is_empty() {
                conditions.push(format!(
                    "(t.title LIKE '%{}%' OR t.description LIKE '%{}%')",
                    keyword, keyword
                ));
            }
        }

        if let Some(status) = &query.status {
            conditions.push(format!("t.status = '{}'", status));
        }

        if let Some(priority) = &query.priority {
            conditions.push(format!("t.priority = '{}'", priority));
        }

        if let Some(completed) = query.completed {
            conditions.push(format!("t.completed = {}", completed));
        }

        if let Some(archived) = query.archived {
            conditions.push(format!("t.archived = {}", archived));
        }

        if let Some(tags) = &query.tags {
            if !tags.is_empty() {
                let tag_conditions: Vec<String> = tags
                    .iter()
                    .map(|tag| format!("ttr.tag_id = '{}'", tag))
                    .collect();
                conditions.push(format!("({})", tag_conditions.join(" OR ")));
            }
        }

        if !joins.is_empty() {
            sql.push_str(" ");
            sql.push_str(&joins.join(" "));
        }

        if !conditions.is_empty() {
            sql.push_str(" WHERE ");
            sql.push_str(&conditions.join(" AND "));
        }

        sql.push_str(" ORDER BY t.updated_at DESC");

        let rows = sqlx::query(&sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to search todos: {}", e))?;

        let mut todos = Vec::new();
        for row in rows {
            let dependencies_str: String = row.get("dependencies");
            let dependencies: Vec<String> =
                serde_json::from_str(&dependencies_str).unwrap_or_default();

            let todo_id: String = row.get("id");
            let tags = self.get_todo_tags(&todo_id).await?;
            let subtasks = self.get_subtasks(&todo_id).await?;

            todos.push(Todo {
                id: todo_id,
                title: row.get("title"),
                description: row.get("description"),
                status: row.get("status"),
                priority: row.get("priority"),
                due_date: row.get("due_date"),
                estimated_hours: row.get("estimated_hours"),
                actual_hours: row.get("actual_hours"),
                progress: row.get("progress"),
                assignee: row.get("assignee"),
                project_id: row.get("project_id"),
                parent_id: row.get("parent_id"),
                recurring_config: row.get("recurring_config"),
                dependencies,
                completed: row.get("completed"),
                archived: row.get("archived"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                archived_at: row.get("archived_at"),
                tags,
                subtasks,
            });
        }

        Ok(todos)
    }

    pub async fn batch_update_todos(
        &self,
        operation: BatchTodoOperation,
    ) -> Result<Vec<Todo>, String> {
        let now = chrono::Utc::now().timestamp();

        match operation.operation.as_str() {
            "complete" => {
                for todo_id in &operation.todo_ids {
                    sqlx::query("UPDATE todos SET completed = true, status = 'completed', updated_at = ? WHERE id = ?")
                        .bind(now)
                        .bind(todo_id)
                        .execute(&self.pool)
                        .await
                        .map_err(|e| format!("Failed to complete todo {}: {}", todo_id, e))?;
                }
            }
            "archive" => {
                for todo_id in &operation.todo_ids {
                    sqlx::query("UPDATE todos SET archived = true, archived_at = ?, updated_at = ? WHERE id = ?")
                        .bind(now)
                        .bind(now)
                        .bind(todo_id)
                        .execute(&self.pool)
                        .await
                        .map_err(|e| format!("Failed to archive todo {}: {}", todo_id, e))?;
                }
            }
            "delete" => {
                for todo_id in &operation.todo_ids {
                    sqlx::query("DELETE FROM todos WHERE id = ?")
                        .bind(todo_id)
                        .execute(&self.pool)
                        .await
                        .map_err(|e| format!("Failed to delete todo {}: {}", todo_id, e))?;
                }
                return Ok(Vec::new()); // Return empty for deleted todos
            }
            "update" => {
                if let Some(updates) = &operation.updates {
                    for todo_id in &operation.todo_ids {
                        let mut update_req = updates.clone();
                        update_req.id = todo_id.clone();
                        self.update_todo(update_req).await?;
                    }
                }
            }
            _ => return Err(format!("Unknown batch operation: {}", operation.operation)),
        }

        // Return updated todos (except for delete operation)
        let mut result = Vec::new();
        for todo_id in &operation.todo_ids {
            if let Ok(todo) = self.get_todo(todo_id).await {
                result.push(todo);
            }
        }

        Ok(result)
    }

    pub async fn get_todo_stats(&self) -> Result<TodoStats, String> {
        let total_row = sqlx::query("SELECT COUNT(*) as count FROM todos WHERE archived = false")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| format!("Failed to get total count: {}", e))?;
        let total: i64 = total_row.get("count");

        let completed_row = sqlx::query(
            "SELECT COUNT(*) as count FROM todos WHERE completed = true AND archived = false",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get completed count: {}", e))?;
        let completed: i64 = completed_row.get("count");

        let pending = total - completed;

        // Get counts by status
        let in_progress_row = sqlx::query(
            "SELECT COUNT(*) as count FROM todos WHERE status = 'in_progress' AND archived = false",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get in_progress count: {}", e))?;
        let in_progress: i64 = in_progress_row.get("count");

        let blocked_row = sqlx::query(
            "SELECT COUNT(*) as count FROM todos WHERE status = 'blocked' AND archived = false",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get blocked count: {}", e))?;
        let blocked: i64 = blocked_row.get("count");

        // Get overdue count
        let now = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let overdue_row = sqlx::query("SELECT COUNT(*) as count FROM todos WHERE due_date < ? AND completed = false AND archived = false")
            .bind(&now)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| format!("Failed to get overdue count: {}", e))?;
        let overdue: i64 = overdue_row.get("count");

        // Get due today count
        let due_today_row = sqlx::query("SELECT COUNT(*) as count FROM todos WHERE due_date = ? AND completed = false AND archived = false")
            .bind(&now)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| format!("Failed to get due today count: {}", e))?;
        let due_today: i64 = due_today_row.get("count");

        // Get due this week count
        let week_end = chrono::Utc::now()
            .checked_add_signed(chrono::Duration::days(7))
            .unwrap_or_else(chrono::Utc::now)
            .format("%Y-%m-%d")
            .to_string();
        let due_this_week_row = sqlx::query("SELECT COUNT(*) as count FROM todos WHERE due_date BETWEEN ? AND ? AND completed = false AND archived = false")
            .bind(&now)
            .bind(&week_end)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| format!("Failed to get due this week count: {}", e))?;
        let due_this_week: i64 = due_this_week_row.get("count");

        // Get priority distribution
        let mut by_priority = HashMap::new();
        let priority_rows = sqlx::query("SELECT priority, COUNT(*) as count FROM todos WHERE archived = false GROUP BY priority")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to get priority distribution: {}", e))?;

        for row in priority_rows {
            let priority: Option<String> = row.get("priority");
            let count: i64 = row.get("count");
            by_priority.insert(priority.unwrap_or_else(|| "none".to_string()), count);
        }

        // Get project distribution
        let mut by_project = HashMap::new();
        let project_rows = sqlx::query("SELECT project_id, COUNT(*) as count FROM todos WHERE archived = false GROUP BY project_id")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to get project distribution: {}", e))?;

        for row in project_rows {
            let project_id: Option<String> = row.get("project_id");
            let count: i64 = row.get("count");
            by_project.insert(project_id.unwrap_or_else(|| "none".to_string()), count);
        }

        // Get assignee distribution
        let mut by_assignee = HashMap::new();
        let assignee_rows = sqlx::query("SELECT assignee, COUNT(*) as count FROM todos WHERE archived = false GROUP BY assignee")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to get assignee distribution: {}", e))?;

        for row in assignee_rows {
            let assignee: Option<String> = row.get("assignee");
            let count: i64 = row.get("count");
            by_assignee.insert(assignee.unwrap_or_else(|| "unassigned".to_string()), count);
        }

        Ok(TodoStats {
            total,
            completed,
            pending,
            in_progress,
            blocked,
            overdue,
            due_today,
            due_this_week,
            by_priority,
            by_project,
            by_assignee,
        })
    }

    // Helper methods for todos
    async fn get_todo_tags(&self, todo_id: &str) -> Result<Vec<String>, String> {
        let rows = sqlx::query(
            "SELECT tt.id FROM todo_tags tt 
             JOIN todo_tag_relations ttr ON tt.id = ttr.tag_id 
             WHERE ttr.todo_id = ?",
        )
        .bind(todo_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get todo tags: {}", e))?;

        Ok(rows.into_iter().map(|row| row.get("id")).collect())
    }

    async fn get_subtasks(&self, parent_id: &str) -> Result<Vec<Todo>, String> {
        let rows = sqlx::query(
            "SELECT id, title, description, status, priority, due_date, estimated_hours, actual_hours, progress, assignee, project_id, parent_id, recurring_config, dependencies, completed, archived, created_by, updated_by, created_at, updated_at, archived_at FROM todos WHERE parent_id = ? ORDER BY created_at ASC"
        )
        .bind(parent_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get subtasks: {}", e))?;

        let mut subtasks = Vec::new();
        for row in rows {
            let dependencies_str: String = row.get("dependencies");
            let dependencies: Vec<String> =
                serde_json::from_str(&dependencies_str).unwrap_or_default();

            let todo_id: String = row.get("id");
            let tags = self.get_todo_tags(&todo_id).await?;

            subtasks.push(Todo {
                id: todo_id,
                title: row.get("title"),
                description: row.get("description"),
                status: row.get("status"),
                priority: row.get("priority"),
                due_date: row.get("due_date"),
                estimated_hours: row.get("estimated_hours"),
                actual_hours: row.get("actual_hours"),
                progress: row.get("progress"),
                assignee: row.get("assignee"),
                project_id: row.get("project_id"),
                parent_id: row.get("parent_id"),
                recurring_config: row.get("recurring_config"),
                dependencies,
                completed: row.get("completed"),
                archived: row.get("archived"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                archived_at: row.get("archived_at"),
                tags,
                subtasks: Vec::new(), // Don't load nested subtasks to avoid infinite recursion
            });
        }

        Ok(subtasks)
    }

    // ============================================================================
    // Todo Tag Management
    // ============================================================================

    pub async fn create_todo_tag(&self, req: CreateTodoTagRequest) -> Result<TodoTag, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        // Get color info from predefined colors
        let color_info = self.get_tag_color_info(&req.color_id)?;

        sqlx::query(
            "INSERT INTO todo_tags (id, name, color, bg_color, color_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.name)
        .bind(&color_info.color)
        .bind(&color_info.bg_color)
        .bind(&req.color_id)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to create todo tag: {}", e))?;

        Ok(TodoTag {
            id,
            name: req.name,
            color: color_info.color,
            bg_color: color_info.bg_color,
            color_id: req.color_id,
            created_at: now,
        })
    }

    pub async fn get_todo_tags_list(&self) -> Result<Vec<TodoTag>, String> {
        let rows = sqlx::query(
            "SELECT id, name, color, bg_color, color_id, created_at FROM todo_tags ORDER BY created_at ASC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get todo tags: {}", e))?;

        let mut tags = Vec::new();
        for row in rows {
            tags.push(TodoTag {
                id: row.get("id"),
                name: row.get("name"),
                color: row.get("color"),
                bg_color: row.get("bg_color"),
                color_id: row.get("color_id"),
                created_at: row.get("created_at"),
            });
        }

        Ok(tags)
    }

    pub async fn update_todo_tag(&self, req: UpdateTodoTagRequest) -> Result<TodoTag, String> {
        let mut updates = Vec::new();
        let mut color_info = None;

        if req.name.is_some() {
            updates.push("name = ?");
        }

        if let Some(color_id) = &req.color_id {
            color_info = Some(self.get_tag_color_info(color_id)?);
            updates.push("color = ?");
            updates.push("bg_color = ?");
            updates.push("color_id = ?");
        }

        if updates.is_empty() {
            return Err("No updates provided".to_string());
        }

        let sql = format!("UPDATE todo_tags SET {} WHERE id = ?", updates.join(", "));
        let mut query = sqlx::query(&sql);

        if let Some(name) = &req.name {
            query = query.bind(name);
        }

        if let Some(color_info) = &color_info {
            query = query
                .bind(&color_info.color)
                .bind(&color_info.bg_color)
                .bind(&req.color_id);
        }

        query = query.bind(&req.id);

        query
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update todo tag: {}", e))?;

        self.get_todo_tag(&req.id).await
    }

    pub async fn get_todo_tag(&self, tag_id: &str) -> Result<TodoTag, String> {
        let row = sqlx::query(
            "SELECT id, name, color, bg_color, color_id, created_at FROM todo_tags WHERE id = ?",
        )
        .bind(tag_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get todo tag: {}", e))?;

        Ok(TodoTag {
            id: row.get("id"),
            name: row.get("name"),
            color: row.get("color"),
            bg_color: row.get("bg_color"),
            color_id: row.get("color_id"),
            created_at: row.get("created_at"),
        })
    }

    pub async fn delete_todo_tag(&self, tag_id: String) -> Result<(), String> {
        // Tag relations will be deleted by CASCADE
        sqlx::query("DELETE FROM todo_tags WHERE id = ?")
            .bind(&tag_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete todo tag: {}", e))?;

        Ok(())
    }

    fn get_tag_color_info(&self, color_id: &str) -> Result<TagColorInfo, String> {
        let colors = [
            ("red", "#ef4444", "#fef2f2"),
            ("orange", "#f97316", "#fff7ed"),
            ("amber", "#f59e0b", "#fffbeb"),
            ("yellow", "#eab308", "#fefce8"),
            ("lime", "#84cc16", "#f7fee7"),
            ("green", "#22c55e", "#f0fdf4"),
            ("emerald", "#10b981", "#ecfdf5"),
            ("teal", "#14b8a6", "#f0fdfa"),
            ("cyan", "#06b6d4", "#ecfeff"),
            ("sky", "#0ea5e9", "#f0f9ff"),
            ("blue", "#3b82f6", "#eff6ff"),
            ("indigo", "#6366f1", "#eef2ff"),
            ("violet", "#8b5cf6", "#f5f3ff"),
            ("purple", "#a855f7", "#faf5ff"),
            ("fuchsia", "#d946ef", "#fdf4ff"),
            ("pink", "#ec4899", "#fdf2f8"),
            ("rose", "#f43f5e", "#fff1f2"),
            ("gray", "#6b7280", "#f9fafb"),
        ];

        for (id, color, bg_color) in colors.iter() {
            if *id == color_id {
                return Ok(TagColorInfo {
                    color: color.to_string(),
                    bg_color: bg_color.to_string(),
                });
            }
        }

        Err(format!("Unknown color ID: {}", color_id))
    }
}

struct TagColorInfo {
    color: String,
    bg_color: String,
}
