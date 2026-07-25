# BranchNotes

BranchNotes es una extensión de VS Code para guardar notas Markdown locales de Git, organizadas por repositorio y rama. Permite consultar el contexto de una rama sin mezclarlo con el código de otra.

## Instalación

Durante el desarrollo se puede ejecutar la extensión con **Run BranchNotes Extension** desde el panel de depuración. Para instalar una versión empaquetada, ejecuta `npm run package` y abre el `.vsix` generado con **Extensions: Install from VSIX**.

## Comandos

- **BranchNotes: Open Notes Panel**: abre el visor agrupado por rama.
- **BranchNotes: Create Note**: solicita el título y abre inmediatamente un archivo Markdown editable.
- **BranchNotes: Create Note from TODOs**: escanea el repositorio y genera una nota Markdown agrupada por archivo.
- **BranchNotes: Edit Note**: abre el archivo original en el editor de VS Code.
- **BranchNotes: Delete Note**: pide confirmación y envía el archivo a la papelera.
- **BranchNotes: Add Notes to .gitignore**: añade `.vscode/branchnotes/` al `.gitignore`, siempre con confirmación explícita.

También puedes abrir el panel haciendo clic en **$(note) BranchNotes** en la barra de estado inferior de VS Code. El botón aparece en la ventana **Extension Development Host** iniciada por la depuración.

### Escribir notas en Markdown

Al crear una nota solo se solicita el título. Después se abre el archivo `.md` original en el editor de VS Code, donde puedes escribir Markdown normalmente: encabezados, listas, enlaces, código y checkboxes. Para ver la previsualización, usa **Markdown: Open Preview to the Side** (`Cmd+K V` en macOS). Los metadatos se mantienen automáticamente en el front matter superior del archivo.

El panel también incluye **Importar TODOs**, que busca `TODO`, `FIXME`, `HACK` y `XXX`, excluye dependencias y carpetas generadas, y crea una nota nueva con archivo, línea y texto agrupados.

### Configuración del escáner de TODOs

Las etiquetas y exclusiones se pueden cambiar desde **Settings → Extensions → BranchNotes** o desde `settings.json`:

```json
{
	"branchnotes.todoMarkers": ["TODO", "FIXME", "BUG", "REVIEW"],
	"branchnotes.todoExcludeDirectories": [".git", "node_modules", "dist", "vendor"],
	"branchnotes.todoMaxTextLength": 100
}
```

Si no configuras estos valores, se usan `TODO`, `FIXME`, `HACK` y `XXX`, junto con las carpetas generadas habituales (`.git`, `.vscode`, `node_modules`, `.venv`, `venv`, `__pycache__`, `dist`, `build` y otras). El texto de cada resultado se limita por defecto a 100 caracteres y termina en `...`; puedes cambiarlo con `branchnotes.todoMaxTextLength`. Si dejas una lista vacía, BranchNotes también recupera los valores por defecto.

## Almacenamiento

Cada nota es un archivo independiente con front matter y contenido Markdown:

```text
.vscode/branchnotes/
├─ branches/
│  ├─ main-<hash>/notes/<id>.md
│  └─ feature-login-<hash>/notes/<id>.md
└─ no-git/notes/<id>.md
```

Las ramas se convierten en claves seguras con un hash para evitar colisiones entre `feature/login`, `feature-login` y nombres con Unicode. El nombre de rama original se conserva en los metadatos. El panel escanea todas las ramas almacenadas, incluso si ya no existen localmente.

En un workspace sin Git, las notas se guardan en `no-git` y el panel muestra **Sin repositorio Git**. El MVP usa la primera carpeta en un workspace multi-root.

Las notas se guardan localmente en el workspace, pero no se ignoran automáticamente. Puedes versionarlas intencionadamente o ejecutar el comando de protección para añadir `.vscode/branchnotes/` a `.gitignore`.

## Seguridad del visor

El Webview utiliza Content Security Policy, nonces para el script y mensajes tipados. Markdown se renderiza con `markdown-it` y se sanitiza antes de insertarse en el DOM; HTML embebido, scripts y atributos peligrosos no se ejecutan.

## Desarrollo

Requisitos: Node.js LTS y VS Code.

```text
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run package
```

La integración usa `@vscode/test-electron`; en Linux necesita un display virtual, por ejemplo `xvfb-run -a npm run test:integration`. Las pruebas trabajan con directorios temporales o con el entorno de pruebas de VS Code y no deben usar las notas reales del workspace.

## Publicación

Los workflows de GitHub Actions ejecutan lint, typecheck, pruebas y empaquetado en cada push y pull request. `release.yml` también se activa manualmente o con tags semánticos como `v0.1.0`, publica el `.vsix` como artefacto y utiliza el secreto protegido `VSCE_PAT` para el Marketplace. El token nunca se almacena en el repositorio.

## Limitaciones y roadmap

El MVP no incluye sincronización remota, colaboración, cifrado, búsqueda avanzada, etiquetas, favoritos, configuración de ubicación ni soporte completo para múltiples repositorios en un workspace multi-root. Las siguientes iteraciones pueden añadir esas capacidades y un editor Markdown dedicado dentro del Webview.
