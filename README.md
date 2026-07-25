# BranchNotes (MVP)

Extensión para VS Code enfocada en tomar notas por **repositorio + rama**, evitando que esas notas se suban por error a Git.

## 1) Estructura propuesta del proyecto

```text
branchnotes/
├─ .vscode/
│  ├─ launch.json
│  └─ tasks.json
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ release.yml
├─ src/
│  ├─ extension.ts                # activate/deactivate, comandos, wiring
│  ├─ git/
│  │  └─ branchService.ts         # detección rama actual (VS Code Git API + fallback)
│  ├─ notes/
│  │  ├─ noteRepository.ts        # persistencia local por workspace+rama
│  │  └─ noteTypes.ts
│  ├─ webview/
│  │  ├─ notesPanel.ts            # creación y ciclo de vida del WebviewPanel
│  │  └─ markdownRenderer.ts      # sanitización/render de markdown
│  └─ commands/
│     ├─ openNotes.ts
│     ├─ createNote.ts
│     └─ listNotes.ts
├─ test/
│  ├─ unit/
│  └─ integration/
├─ package.json
├─ tsconfig.json
├─ .eslintrc.cjs
├─ .gitignore
└─ README.md
```

## 2) APIs de VS Code necesarias

- **Git API** (vscode.git):
  - `vscode.extensions.getExtension('vscode.git')`
  - `getAPI(1)` para acceder a repositorios y rama activa.
- **Storage local**:
  - `ExtensionContext.workspaceState` para persistencia por workspace.
  - Alternativa: archivo local en `.vscode/branchnotes.json` y agregarlo a `.gitignore`.
- **Webview Panel**:
  - `vscode.window.createWebviewPanel(...)`
  - `panel.webview.html` para renderizar listado y detalle en Markdown.
  - `postMessage/onDidReceiveMessage` para interacción UI <-> extensión.

## 3) Fases de desarrollo del MVP

### Fase 0 — Bootstrap técnico
1. Inicializar extensión TypeScript (`yo code` o plantilla oficial VS Code).
2. Definir comandos base en `package.json`:
   - `branchnotes.openPanel`
   - `branchnotes.createNote`
3. Configurar ESLint + tests (`@vscode/test-electron`, `mocha`).

### Fase 1 — Núcleo de dominio (rama + almacenamiento)
1. Implementar `branchService` para detectar rama activa por repositorio.
2. Diseñar clave de almacenamiento: `notes::<workspaceFolder>::<branchName>`.
3. Crear `noteRepository` con operaciones CRUD mínimas (crear/listar).
4. Verificar que la persistencia sea local y nunca trackeada en Git.

### Fase 2 — UI Webview con Markdown
1. Crear panel `BranchNotes`.
2. Listar notas de todas las ramas del repositorio.
3. Mostrar metadata visible: rama de origen, fecha, título.
4. Renderizar contenido Markdown en detalle de nota.

### Fase 3 — Testing y calidad
1. **Unit tests**:
   - clave de storage por workspace/rama.
   - lectura de rama con mocks de Git API.
2. **Integration tests**:
   - comando abre panel.
   - creación de nota y posterior listado.
3. Ejecutar tests en CI en cada push y PR.

### Fase 4 — CI/CD en GitHub Actions
1. `ci.yml`:
   - checkout
   - setup node
   - install (`npm ci`)
   - lint + test
2. `release.yml` (manual/tag):
   - build
   - `vsce package`
   - `vsce publish` usando `VSCE_PAT` en secrets.
3. Versionado semántico y changelog mínimo por release.

### Fase 5 — Documentación y adopción
1. README con propuesta de valor, instalación y comandos.
2. GIF/capturas del flujo principal (crear + ver notas por rama).
3. Sección de limitaciones del MVP y roadmap.

## 4) Ejemplo básico de código

### 4.1 Leer rama actual con Git API

```ts
import * as vscode from 'vscode';

export async function getCurrentBranchName(): Promise<string | undefined> {
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
  const git = gitExtension?.getAPI(1);
  const repo = git?.repositories?.[0];

  return repo?.state.HEAD?.name;
}
```

### 4.2 Abrir Webview Panel

```ts
import * as vscode from 'vscode';

export function openBranchNotesPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'branchNotes',
    'BranchNotes',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = `
    <!doctype html>
    <html>
      <body>
        <h1>BranchNotes</h1>
        <p>Listado de notas por rama</p>
      </body>
    </html>
  `;
}
```

## 5) Recomendación de implementación incremental

1. Entregar primero Fase 1 + comando simple de creación/listado (sin UI compleja).
2. Agregar Webview en segunda iteración.
3. Cerrar MVP cuando CI, tests y publicación estén automatizados.
