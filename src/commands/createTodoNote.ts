import * as vscode from 'vscode';
import type { BranchService } from '../git/branchService';
import type { NoteFileRepository } from '../storage/noteFileRepository';
import type { NotesPanel } from '../webview/notesPanel';
import { TodoScanner } from '../todos/todoScanner';

export async function createTodoNote(
  repository: NoteFileRepository,
  branches: BranchService,
  panel: NotesPanel,
  scanner: TodoScanner = new TodoScanner()
): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Abre un workspace para buscar TODOs.');
    return;
  }

  const todos = await scanner.scan(folder.uri);
  if (todos.length === 0) {
    void vscode.window.showInformationMessage('No se encontraron TODOs, FIXMEs, HACKs o XXXs.');
    return;
  }

  const context = await branches.getCurrentContext(folder);
  const generatedAt = new Date().toISOString();
  const grouped = new Map<string, typeof todos>();
  for (const todo of todos) {
    const items = grouped.get(todo.relativePath) ?? [];
    items.push(todo);
    grouped.set(todo.relativePath, items);
  }

  const sections = [...grouped.entries()].map(([file, items]) => {
    const lines = items.map((item) => `- [ ] **${item.marker}**, línea ${item.line}: ${item.text}`);
    return `## ${file}\n\n${lines.join('\n')}`;
  });
  const content = [
    `> Generado automáticamente el ${generatedAt}. Puedes editar esta nota libremente.`,
    '',
    `Total: **${todos.length}** elemento(s).`,
    '',
    ...sections
  ].join('\n');

  const note = await repository.create(folder.uri, context, {
    title: `TODOs del repositorio (${new Date().toLocaleDateString()})`,
    content
  });
  await vscode.window.showTextDocument(note.fileUri as vscode.Uri, { preview: false });
  await panel.refresh();
  void vscode.window.showInformationMessage(`Se creó una nota con ${todos.length} TODO(s).`);
}
