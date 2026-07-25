import * as vscode from 'vscode';
import type { NotesPathService } from '../storage/notesPathService';

export async function protectNotes(paths: NotesPathService): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Abre un workspace para proteger sus notas.');
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    'Las notas se guardan en el workspace. Puedes ignorarlas en Git o mantenerlas versionables.',
    'Añadir al .gitignore',
    'Mantener versionables',
    'Cancelar'
  );
  if (choice !== 'Añadir al .gitignore') {
    return;
  }

  const confirmation = await vscode.window.showWarningMessage(
    '¿Confirmas añadir .vscode/branchnotes/ al .gitignore de este workspace?',
    { modal: true },
    'Confirmar'
  );
  if (confirmation !== 'Confirmar') {
    return;
  }

  const gitignore = vscode.Uri.joinPath(folder.uri, '.gitignore');
  const ignoreEntry = `${paths.rootFolderName}/`;
  let existing = '';
  try {
    existing = new TextDecoder().decode(await vscode.workspace.fs.readFile(gitignore));
  } catch (error) {
    if (!isFileNotFound(error)) {
      throw error;
    }
  }
  const lines = existing.split(/\r?\n/);
  if (lines.some((line) => line.trim().replace(/\/$/, '') === paths.rootFolderName)) {
    void vscode.window.showInformationMessage('BranchNotes ya está protegido en .gitignore.');
    return;
  }
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? `${existing}\n` : existing;
  await vscode.workspace.fs.writeFile(gitignore, new TextEncoder().encode(`${prefix}${ignoreEntry}\n`));
  void vscode.window.showInformationMessage('Se añadió .vscode/branchnotes/ al .gitignore.');
}

function isFileNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'FileNotFound';
}
