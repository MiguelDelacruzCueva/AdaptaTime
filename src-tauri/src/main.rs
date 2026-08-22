// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[tauri::command]
fn start_window_drag(window: tauri::WebviewWindow) {
    let _ = window.start_dragging();
}

#[tauri::command]
fn minimize_window(window: tauri::WebviewWindow) {
    let _ = window.minimize();
}

#[tauri::command]
fn toggle_maximize(window: tauri::WebviewWindow) {
    if let Ok(is_max) = window.is_maximized() {
        if is_max {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn close_app(window: tauri::WebviewWindow) {
    let _ = window.close();
}

#[tauri::command]
fn enter_mini_mode(window: tauri::WebviewWindow) {
    let _ = window.set_resizable(true);
    let _ = window.set_min_size(Some(tauri::LogicalSize::new(260.0, 150.0)));
    let _ = window.set_size(tauri::LogicalSize::new(300.0, 170.0));
    let _ = window.set_always_on_top(true);
    let _ = window.set_resizable(false);
}

#[tauri::command]
fn exit_mini_mode(window: tauri::WebviewWindow) {
    let _ = window.set_always_on_top(false);
    let _ = window.set_resizable(true);
    // 1. Quitar límite mínimo temporalmente para que Windows no bloquee el resize
    let _ = window.set_min_size(None::<tauri::LogicalSize<f64>>);
    // 2. Restaurar tamaño estándar de la app principal
    let _ = window.set_size(tauri::LogicalSize::new(980.0, 680.0));
    // 3. Volver a aplicar el límite mínimo estándar y centrar
    let _ = window.set_min_size(Some(tauri::LogicalSize::new(480.0, 500.0)));
    let _ = window.center();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            toggle_maximize,
            close_app,
            enter_mini_mode,
            exit_mini_mode,
            start_window_drag
        ])
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "Mostrar Focus Flow", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar la aplicación Tauri");
}