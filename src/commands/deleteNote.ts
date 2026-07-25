import * as vscode from 'vscode';
import type { NoteFileRepository } from '../storage/noteFileRepository';
import type { Note } from '../storage/noteTypes';
import type { NotesPanel } from '../webview/notesPanel';

export async function deleteNote(
  repository: NoteFileRepository,
  panel: NotesPanel,
  noteId?: string
): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Abre un workspace para eliminar una nota.');
    return;
  }
  let note: Note | undefined = noteId ? await repository.findById(folder.uri, noteId) : undefined;
  if (!note) {
    const result = await repository.listAll(folder.uri);
    const selected = await vscode.window.showQuickPick(
      result.notes.map((item) => ({ label: item.title, description: item.branchName, note: item })),
      { placeHolder: 'Selecciona una nota para eliminar' }
    );
    note = selected?.note;
  }
  if (!note?.fileUri) {
    void vscode.window.showWarningMessage('No se encontró la nota seleccionada.');
    return;
  }
  const answer = await vscode.window.showWarningMessage(
    `¿Eliminar la nota “${note.title}”? Esta acción envía el archivo a la papelera.`,
    { modal: true },
    'Eliminar'
  );
  if (answer !== 'Eliminar') {
    return;
  }
  await repository.remove(note.fileUri);
  await panel.refresh();
}
