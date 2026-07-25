import * as vscode from 'vscode';
import type { BranchService } from '../git/branchService';
import type { NoteFileRepository } from '../storage/noteFileRepository';
import { renderMarkdown } from './markdownRenderer';
import type { ExtensionToWebview, PanelState, WebviewToExtension } from './webviewMessages';

export interface NotesPanelActions {
  onCreate: () => Promise<void>;
  onCreateTodos: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => Promise<void>;
}

export class NotesPanel {
  private panel?: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  public constructor(
    private readonly repository: NoteFileRepository,
    private readonly branches: BranchService,
    private readonly actions: NotesPanelActions
  ) {}

  public open(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      void this.refresh();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'branchNotes',
      'BranchNotes',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.webview.html = this.getHtml();
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((message: WebviewToExtension) => this.handleMessage(message)),
      this.panel.onDidDispose(() => this.disposePanel())
    );
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder || !this.panel) {
      return;
    }

    try {
      const context = await this.branches.getCurrentContext(folder);
      const result = await this.repository.listAll(folder.uri);
      const state: PanelState = {
        context: {
          status: context.status,
          displayName: context.displayName,
          branchName: context.branchName
        },
        notes: result.notes.map((note) => ({
          ...note,
          fileUri: note.fileUri?.toString() ?? '',
          contentHtml: renderMarkdown(note.content)
        })),
        invalidFiles: result.errors.length
      };
      await this.panel.webview.postMessage({ type: 'state', state } satisfies ExtensionToWebview);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.panel.webview.postMessage({ type: 'error', message } satisfies ExtensionToWebview);
    }
  }

  private async handleMessage(message: WebviewToExtension): Promise<void> {
    try {
      switch (message.type) {
        case 'create':
          await this.actions.onCreate();
          break;
        case 'createTodos':
          await this.actions.onCreateTodos();
          break;
        case 'delete':
          await this.actions.onDelete(message.id);
          break;
        case 'open':
          await this.actions.onOpen(message.id);
          break;
        case 'refresh':
          await this.refresh();
          break;
      }
    } catch (error) {
      void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  private getHtml(): string {
    const nonce = createNonce();
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>BranchNotes</title>
  <style>
    :root { color-scheme: light dark; }
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 24px; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    h1 { font-size: 22px; margin: 0; }
    h2 { font-size: 15px; margin: 22px 0 10px; color: var(--vscode-textLink-foreground); }
    button { border: 0; border-radius: 4px; padding: 7px 11px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .context { color: var(--vscode-descriptionForeground); font-size: 13px; margin: 5px 0 0; }
    .empty, .warning { padding: 18px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; color: var(--vscode-descriptionForeground); }
    .warning { border-color: var(--vscode-editorWarning-foreground); margin-bottom: 16px; }
    .note { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 14px; margin-bottom: 10px; }
    .note-header { display: flex; justify-content: space-between; gap: 12px; }
    .note-title { font-weight: 600; font-size: 15px; }
    .note-date { color: var(--vscode-descriptionForeground); font-size: 11px; white-space: nowrap; }
    .note-content { margin-top: 10px; line-height: 1.5; overflow-wrap: anywhere; }
    .note-content pre { overflow-x: auto; padding: 10px; background: var(--vscode-textCodeBlock-background); }
    .note-content a { color: var(--vscode-textLink-foreground); }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  </style>
</head>
<body>
  <header>
    <div><h1>BranchNotes</h1><p class="context" id="context">Cargando notas…</p></div>
    <div class="toolbar"><button id="create">Nueva nota</button><button class="secondary" id="createTodos">Importar TODOs</button></div>
  </header>
  <main id="notes" aria-live="polite"><div class="empty">Cargando…</div></main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const notesRoot = document.getElementById('notes');
    const contextRoot = document.getElementById('context');
    document.getElementById('create').addEventListener('click', () => vscode.postMessage({ type: 'create' }));
    document.getElementById('createTodos').addEventListener('click', () => vscode.postMessage({ type: 'createTodos' }));
    notesRoot.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      vscode.postMessage({ type: button.dataset.action, id: button.dataset.id });
    });
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'error') {
        notesRoot.innerHTML = '<div class="warning"></div>';
        notesRoot.querySelector('.warning').textContent = message.message;
        return;
      }
      if (message.type !== 'state') return;
      const state = message.state;
      contextRoot.textContent = state.context.displayName + (state.context.status === 'no-git' ? ' · las notas se guardan en no-git' : '');
      notesRoot.replaceChildren();
      if (state.invalidFiles > 0) {
        const warning = document.createElement('div');
        warning.className = 'warning';
        warning.textContent = state.invalidFiles + ' archivo(s) Markdown no válido(s) se omitieron.';
        notesRoot.appendChild(warning);
      }
      if (state.notes.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Todavía no hay notas. Crea la primera desde este panel.';
        notesRoot.appendChild(empty);
        return;
      }
      const groups = new Map();
      for (const note of state.notes) {
        if (!groups.has(note.branchName)) groups.set(note.branchName, []);
        groups.get(note.branchName).push(note);
      }
      for (const [branch, notes] of groups) {
        const heading = document.createElement('h2');
        heading.textContent = branch;
        notesRoot.appendChild(heading);
        for (const note of notes) {
          const article = document.createElement('article');
          article.className = 'note';
          article.innerHTML = '<div class="note-header"><span class="note-title"></span><span class="note-date"></span></div><div class="note-content"></div><div class="actions"><button data-action="open">Abrir archivo</button><button class="secondary" data-action="delete">Eliminar</button></div>';
          article.querySelector('.note-title').textContent = note.title;
          article.querySelector('.note-date').textContent = new Date(note.modifiedAt).toLocaleString();
          article.querySelector('.note-content').innerHTML = note.contentHtml;
          article.querySelectorAll('button').forEach((button) => { button.dataset.id = note.id; });
          notesRoot.appendChild(article);
        }
      }
    });
    vscode.postMessage({ type: 'refresh' });
  </script>
</body>
</html>`;
  }

  private disposePanel(): void {
    this.panel = undefined;
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }
}

function createNonce(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let index = 0; index < 32; index += 1) {
    value += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return value;
}
