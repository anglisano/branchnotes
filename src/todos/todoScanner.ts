import * as path from 'node:path';
import * as vscode from 'vscode';

export interface TodoItem {
  fileUri: vscode.Uri;
  relativePath: string;
  line: number;
  marker: string;
  text: string;
}

export const DEFAULT_TODO_MARKERS = ['TODO', 'FIXME', 'HACK', 'XXX'];
export const DEFAULT_TODO_EXCLUDES = [
  '.git',
  '.vscode',
  'node_modules',
  '.venv',
  'venv',
  '__pycache__',
  'out',
  'dist',
  'build',
  '.vscode-test',
  'coverage'
];
export const DEFAULT_TODO_MAX_TEXT_LENGTH = 100;

export class TodoScanner {
  public async scan(workspaceRoot: vscode.Uri): Promise<TodoItem[]> {
    const configuration = vscode.workspace.getConfiguration('branchnotes');
    const configuredMarkers = configuration.get<unknown[]>('todoMarkers', DEFAULT_TODO_MARKERS);
    const configuredExcludes = configuration.get<unknown[]>('todoExcludeDirectories', DEFAULT_TODO_EXCLUDES);
    const configuredMaxLength = configuration.get<unknown>('todoMaxTextLength', DEFAULT_TODO_MAX_TEXT_LENGTH);
    const markers = this.cleanList(configuredMarkers, DEFAULT_TODO_MARKERS);
    const excludes = this.cleanList(configuredExcludes, DEFAULT_TODO_EXCLUDES);
    const maxTextLength = this.cleanMaxTextLength(configuredMaxLength);
    const markerPattern = markers.map((marker) => escapeRegExp(marker)).join('|');
    // Use Unicode-aware boundaries: JavaScript's `\\b` treats accented letters
    // as non-word characters, so it incorrectly matched `TODO` inside `método`.
    const todoPattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${markerPattern})(?![\\p{L}\\p{N}_])\\s*[:\\-]?\\s*(.*)$`, 'iu');
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceRoot, '**/*'),
      `**/{${excludes.join(',')}}/**`
    );
    const todos: TodoItem[] = [];

    for (const fileUri of files) {
      if (this.isLikelyBinary(fileUri)) {
        continue;
      }
      const bytes = await vscode.workspace.fs.readFile(fileUri);
      const content = new TextDecoder().decode(bytes);
      const lines = content.split(/\r?\n/);
      lines.forEach((lineText, index) => {
        const match = lineText.match(todoPattern);
        if (!match) {
          return;
        }
        const marker = match[1].toUpperCase();
        const text = this.limitText(match[2].trim() || lineText.trim(), maxTextLength);
        todos.push({
          fileUri,
          relativePath: path.relative(workspaceRoot.fsPath, fileUri.fsPath),
          line: index + 1,
          marker,
          text
        });
      });
    }

    return todos.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);
  }

  private isLikelyBinary(uri: vscode.Uri): boolean {
    return /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|woff2?|ttf|eot|mp[34]|mov|avi|sqlite|db)$/i.test(uri.path);
  }

  private cleanList(value: unknown[] | undefined, fallback: string[]): string[] {
    const result = (value ?? [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return result.length > 0 ? [...new Set(result)] : fallback;
  }

  private cleanMaxTextLength(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 1
      ? Math.floor(value)
      : DEFAULT_TODO_MAX_TEXT_LENGTH;
  }

  private limitText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    if (maxLength <= 3) {
      return text.slice(0, maxLength);
    }
    return `${text.slice(0, maxLength - 3).trimEnd()}...`;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
