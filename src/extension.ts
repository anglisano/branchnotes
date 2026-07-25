import * as vscode from 'vscode';
import { BranchService } from './git/branchService';
import { createNote } from './commands/createNote';
import { createTodoNote } from './commands/createTodoNote';
import { deleteNote } from './commands/deleteNote';
import { editNote } from './commands/editNote';
import { openNotes } from './commands/openNotes';
import { protectNotes } from './commands/protectNotes';
import { NoteFileRepository } from './storage/noteFileRepository';
import { NotesPathService } from './storage/notesPathService';
import { NotesPanel } from './webview/notesPanel';

export function activate(context: vscode.ExtensionContext): void {
  const paths = new NotesPathService();
  const repository = new NoteFileRepository(paths);
  const branches = new BranchService();
  let panel: NotesPanel;
  panel = new NotesPanel(repository, branches, {
    onCreate: (): Promise<void> => createNote(repository, branches, panel),
    onCreateTodos: (): Promise<void> => createTodoNote(repository, branches, panel),
    onDelete: (id): Promise<void> => deleteNote(repository, panel, id),
    onOpen: (id): Promise<void> => editNote(repository, id)
  });

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(note) BranchNotes';
  statusBar.tooltip = 'Abrir notas de BranchNotes';
  statusBar.command = 'branchnotes.openPanel';
  statusBar.show();

  context.subscriptions.push(
    vscode.commands.registerCommand('branchnotes.openPanel', () => openNotes(panel)),
    vscode.commands.registerCommand('branchnotes.createNote', () => createNote(repository, branches, panel)),
    vscode.commands.registerCommand('branchnotes.createTodoNote', () => createTodoNote(repository, branches, panel)),
    vscode.commands.registerCommand('branchnotes.editNote', (id?: string) => editNote(repository, id)),
    vscode.commands.registerCommand('branchnotes.deleteNote', (id?: string) => deleteNote(repository, panel, id)),
    vscode.commands.registerCommand('branchnotes.protectNotes', () => protectNotes(paths)),
    statusBar,
    branches.watch(vscode.workspace.workspaceFolders?.[0], () => void panel.refresh())
  );
}

export function deactivate(): void {
  // VS Code disposes registered commands and subscriptions automatically.
}
