import * as vscode from 'vscode';
import { branchKey } from './branchKey';
import type { BranchContext } from './noteTypes';

export class NotesPathService {
  public readonly rootFolderName = '.vscode/branchnotes';

  public getNotesRoot(workspaceRoot: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot, '.vscode', 'branchnotes');
  }

  public getBranchDirectory(workspaceRoot: vscode.Uri, context: BranchContext): vscode.Uri {
    if (context.status === 'no-git') {
      return vscode.Uri.joinPath(this.getNotesRoot(workspaceRoot), 'no-git', 'notes');
    }
    const branchFolder = context.branchKey || branchKey(context.branchName);
    return vscode.Uri.joinPath(this.getNotesRoot(workspaceRoot), 'branches', branchFolder, 'notes');
  }

  public getNoteUri(workspaceRoot: vscode.Uri, context: BranchContext, id: string): vscode.Uri {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error('El identificador de la nota no es seguro.');
    }
    return vscode.Uri.joinPath(this.getBranchDirectory(workspaceRoot, context), `${id}.md`);
  }

  public getWorkspaceId(workspaceRoot: vscode.Uri): string {
    return workspaceRoot.toString();
  }
}
