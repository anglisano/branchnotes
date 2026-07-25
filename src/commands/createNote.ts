import * as vscode from 'vscode';
import type { BranchService } from '../git/branchService';
import type { NoteFileRepository } from '../storage/noteFileRepository';
import type { NotesPanel } from '../webview/notesPanel';

export async function createNote(
  repository: NoteFileRepository,
  branches: BranchService,
  panel: NotesPanel
): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Abre un workspace para crear una nota.');
    return;
  }
  const title = await vscode.window.showInputBox({
    prompt: 'Título de la nota',
    placeHolder: 'Por ejemplo: decisiones de la implementación',
    ignoreFocusOut: true
  });
  if (title === undefined) {
    return;
  }
  const context = await branches.getCurrentContext(folder);
  const note = await repository.create(folder.uri, context, { title, content: '' });
  await vscode.window.showTextDocument(note.fileUri as vscode.Uri, { preview: false });
  await panel.refresh();
}
