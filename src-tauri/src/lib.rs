/*
 * SnippetsHub - 代码片段管理工具
 *
 * @file lib.rs - 应用核心逻辑库
 * @author Noah
 * @description Tauri 应用的入口配置和插件初始化
 * @created 2026-01-07
 * @modified 2026-02-03
 * @version 1.0.0
 *
 * 功能职责:
 * - 配置和构建 Tauri 应用实例
 * - 注册所有 Tauri 插件 (Shell, FS, Clipboard, etc.)
 * - 初始化数据库连接
 * - 设置系统托盘 (System Tray) 和菜单
 * - 注册 invoke handler (命令处理)
 * - 管理全局状态 (AppState)
 */
mod commands;
mod database;
mod models;

use database::Database;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Async Database Initialization
            // Async Database Initialization
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match Database::new(&handle).await {
                    Ok(db) => {
                        handle.manage(db);
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                        // Optional: emit an event to frontend to show error
                    }
                }
            });

            // Initialize LSP servers state
            let lsp_servers: Arc<Mutex<HashMap<String, tokio::process::Child>>> =
                Arc::new(Mutex::new(HashMap::new()));
            app.manage(lsp_servers);

            // System Tray Setup
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            // Toggle visibility
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Original commands
            commands::create_snippet,
            commands::get_all_snippets,
            commands::get_snippet,
            commands::update_snippet,
            commands::delete_snippet,
            commands::search_snippets,
            commands::create_folder,
            commands::get_all_folders,
            commands::delete_folder,
            commands::export_to_json,
            commands::copy_to_clipboard,
            // LSP Integration commands
            commands::check_command_available,
            commands::start_language_server,
            commands::stop_language_server,
            commands::lsp_request,
            commands::lsp_notification,
            // Project Management commands
            commands::create_workspace,
            commands::get_workspaces,
            commands::update_workspace,
            commands::delete_workspace,
            commands::create_project,
            commands::get_projects,
            commands::update_project,
            commands::delete_project,
            commands::get_snippets_by_project,
            // Git Integration commands
            commands::create_git_repository,
            commands::get_git_repositories,
            commands::update_git_repository,
            commands::delete_git_repository,
            // File System commands
            commands::remove_dir_all,
            commands::create_directory,
            commands::read_file_content,
            commands::write_file_content,
            commands::file_exists,
            // Code Execution commands
            commands::execute_code,
            // Todo Management commands
            commands::create_todo,
            commands::get_todos,
            commands::get_todo,
            commands::update_todo,
            commands::delete_todo,
            commands::search_todos,
            commands::batch_update_todos,
            commands::get_todo_stats,
            // Todo Tag Management commands
            commands::create_todo_tag,
            commands::get_todo_tags,
            commands::update_todo_tag,
            commands::delete_todo_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
