<p align="center">
  <img src="./src/assets/logo.svg" alt="Focus Flow Logo" width="540">
</p>

<p align="center">
  <strong>Tu tiempo, tu ritmo.</strong><br>
  Una aplicación de escritorio minimalista y ultra-ligera para la gestión de flujos de trabajo, productividad consciente y pausas activas.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/Rust-Backend-orange?style=flat-square&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/TypeScript-Frontend-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-Windows%20x64-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Size-%3C%202%20MB-brightgreen?style=flat-square" alt="Size">
</p>

---

## 📖 Acerca de Focus Flow

**Focus Flow** es una herramienta de productividad diseñada para eliminar distracciones y estructurar sesiones de trabajo sin fricción. A diferencia de las herramientas convencionales basadas en pomodoros rígidos, Focus Flow permite diseñar **secuencias personalizadas de bloques dinámicos** combinando cuatro fases esenciales:

- ⚡ **Enfoque:** Bloques de concentración profunda.
- ☕ **Descanso:** Pausas breves para recargar energía.
- 🌿 **Movimiento:** Estiramientos o actividad física ligera.
- 🎮 **Procrastinación Consciente:** Espacios delimitados para desconexión controlada.

---

## ✨ Características Principales

### 1. 🗂️ Constructor de Flujos Personalizados
- Diseña secuencias a tu medida con duración de **1 a 60 minutos** por bloque.
- Reordena bloques fluidamente con controles de elevación e inserción directa.
- Vista previa inteligente con muestreo proporcional de barras de color.
- Edición de minutos en tiempo real mediante *inline editing*.

### 2. 🪟 Mini-Widget Flotante (*Picture-in-Picture*)
- Al iniciar una sesión, la aplicación se transforma automáticamente en un **widget compacto de escritorio ($300 \times 170\text{ px}$)**.
- **Always on Top nativo:** Se mantiene fija en una esquina de tu pantalla por encima de navegadores, editores de código o cualquier ventana activa.
- Cabecera con soporte de arrastre (*drag region*) para posicionarlo donde prefieras.
- Color temático reactivo según el tipo de bloque activo y vista previa del bloque siguiente.
- Al completar la sesión o cerrar el widget, la ventana regresa fluidamente a su tamaño estándar.

### 3. ⏱️ Cronómetro Libre (*Live Timer*)
- Modalidad libre para trabajar sin una estructura preestablecida.
- Alterna entre Enfoque, Descanso, Movimiento y Procrastinar con un solo clic.
- Barra de porcentaje proporcional acumulativa y registro directo en las estadísticas diarias.

### 4. 📅 Calendario & Reportes de Productividad
- Matriz mensual de seguimiento cronológico a partir de la fecha de inicio de uso.
- Indicador de cumplimiento de meta diaria (ajustable de 1 a 1440 minutos / 24h).
- Gráfico de barras segmentado con el desglose exacto de minutos y sesiones registradas.

### 5. 🔔 Notificaciones y Audio Sintetizado
- Tonos suaves generados mediante la **Web Audio API** (sin archivos de audio pesados en memoria).
- Notificaciones de escritorio nativas del sistema operativo al culminar cada bloque.
- Integración en la bandeja del sistema (*System Tray*) para segundo plano.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Core / Runtime** | [Tauri v2](https://tauri.app/) + [Rust](https://www.rust-lang.org/) | Gestión de ventana nativa, redimensionado, tray y alto rendimiento |
| **Frontend** | [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) | Lógica reactiva modular sin sobrecarga de frameworks |
| **Diseño / UI** | CSS3 Moderno (Container Queries, Flexbox, Grid) | Interfaz responsiva inspirada en tipografía editorial clásica y tema oscuro |
| **Audio** | Web Audio API | Síntesis armónica de tonos de notificación en tiempo real |
| **Persistencia** | Storage Engine (LocalStorage) | Almacenamiento local privado y sin recopilación de datos externos |

---

## 🚀 Instalación y Uso

### Opción 1: Descargar el Instalador (Recomendado para Usuarios)

1. Descarga el archivo ejecutable más reciente desde el directorio de lanzamientos:
   ```text
   focus-flow_0.1.0_x64-setup.exe
   ```
2. Ejecuta el archivo `.exe` y sigue el asistente de instalación.
3. ¡Listo! Focus Flow creará su acceso directo en tu Escritorio y Menú Inicio.

> **Nota:** Al tratarse de un ejecutable independiente sin certificado de firma comercial, Windows SmartScreen puede mostrar una pantalla preventiva. Haz clic en **"Más información"** $\rightarrow$ **"Ejecutar de todas formas"**.

---

### Opción 2: Compilar desde el Código Fuente

#### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- Dependencias de compilación de C++ para Windows (Build Tools for Visual Studio)

#### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/focus-flow.git](https://github.com/tu-usuario/focus-flow.git)
   cd focus-flow
   ```

2. **Instalar dependencias de frontend:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run tauri dev
   ```

4. **Compilar el instalador para producción (`.exe`):**
   ```bash
   npm run tauri build
   ```
   El instalador se generará en:
   ```text
   src-tauri/target/release/bundle/nsis/focus-flow_0.1.0_x64-setup.exe
   ```

---

## 📁 Estructura del Proyecto

```text
focus-flow/
├── assets/
│   └── logo.svg                 # Isotipo y logotipo oficial en formato vectorial
├── src/
│   ├── components/              # Sidebar, modales y componentes UI
│   ├── models/                  # Interfaces y modelos de TypeScript (Flow, Block, Tasks)
│   ├── services/                # Audio, Storage, Modal y puente nativo Tauri
│   ├── styles/                  # Hojas de estilo modulares (main, timer, editor, calendar)
│   ├── utils/                   # Catálogo de iconos SVG y formateadores de tiempo
│   ├── views/                   # Vistas principales (Home, FlowEditor, ActiveTimer, LiveTimer, Calendar)
│   └── app.ts                   # Enrutador y punto de entrada SPA
├── src-tauri/
│   ├── src/main.rs              # Lógica de ventana nativa, comandos y bandeja en Rust
│   ├── tauri.conf.json          # Configuración de empaquetado, permisos e iconos
│   └── Cargo.toml               # Dependencias del ecosistema Rust / Tauri
├── package.json
└── README.md
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
