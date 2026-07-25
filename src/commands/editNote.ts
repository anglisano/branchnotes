import * as vscode from 'vscode';
import type { NoteFileRepository } from '../storage/noteFileRepository';
import type { Note } from '../storage/noteTypes';

export async function editNote(repository: NoteFileRepository, noteId?: string): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Abre un workspace para editar una nota.');
    return;
  }
  let note: Note | undefined = noteId ? await repository.findById(folder.uri, noteId) : undefined;
  if (!note) {
    const result = await repository.listAll(folder.uri);
    const selected = await vscode.window.showQuickPick(
      result.notes.map((item) => ({ label: item.title, description: item.branchName, note: item })),
      { placeHolder: 'Selecciona una nota para editar' }
    );
    note = selected?.note;
  }
  if (!note?.fileUri) {
    void vscode.window.showWarningMessage('No se encontró la nota seleccionada.');
    return;
  }
  await vscode.window.showTextDocument(note.fileUri, { preview: false });
}
