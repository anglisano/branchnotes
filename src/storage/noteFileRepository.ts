import { randomUUID } from 'node:crypto';
import * as vscode from 'vscode';
import { serializeNote, parseNoteFile } from './frontMatter';
import { NotesPathService } from './notesPathService';
import type { BranchContext, Note, NoteInput, NoteListResult } from './noteTypes';

export class NoteFileRepository {
  public lastErrors: string[] = [];

  public constructor(private readonly paths: NotesPathService = new NotesPathService()) {}

  public async create(workspaceRoot: vscode.Uri, context: BranchContext, input: NoteInput): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: randomUUID(),
      title: input.title.trim() || 'Sin título',
      branchName: context.branchName,
      branchKey: context.branchKey,
      repositoryId: context.repositoryId,
      workspaceId: this.paths.getWorkspaceId(workspaceRoot),
      createdAt: now,
      modifiedAt: now,
      content: input.content
    };
    const uri = this.paths.getNoteUri(workspaceRoot, context, note.id);
    await this.writeTextAtomic(uri, serializeNote(note), false);
    return { ...note, fileUri: uri };
  }

  public async read(uri: vscode.Uri): Promise<Note> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const parsed = parseNoteFile(new TextDecoder().decode(bytes));
    return { ...parsed, fileUri: uri };
  }

  public async listAll(workspaceRoot: vscode.Uri): Promise<NoteListResult> {
    const notes: Note[] = [];
    const errors: string[] = [];
    const root = this.paths.getNotesRoot(workspaceRoot);
    await this.walk(root, notes, errors);
    this.lastErrors = errors;
    return { notes: notes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)), errors };
  }

  public async findById(workspaceRoot: vscode.Uri, id: string): Promise<Note | undefined> {
    const result = await this.listAll(workspaceRoot);
    return result.notes.find((note) => note.id === id);
  }

  public async update(uri: vscode.Uri, changes: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note> {
    const current = await this.read(uri);
    const updated: Note = {
      ...current,
      title: changes.title?.trim() || current.title,
      content: changes.content ?? current.content,
      modifiedAt: new Date().toISOString()
    };
    await this.writeTextAtomic(uri, serializeNote(updated), true);
    return updated;
  }

  public async remove(uri: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  }

  private async walk(uri: vscode.Uri, notes: Note[], errors: string[]): Promise<void> {
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(uri);
    } catch (error) {
      if (this.isFileNotFound(error)) {
        return;
      }
      throw error;
    }

    for (const [name, type] of entries) {
      const child = vscode.Uri.joinPath(uri, name);
      if (type === vscode.FileType.Directory) {
        await this.walk(child, notes, errors);
      } else if (type === vscode.FileType.File && name.toLowerCase().endsWith('.md')) {
        try {
          notes.push(await this.read(child));
        } catch (error) {
          errors.push(`${child.fsPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  private async writeTextAtomic(uri: vscode.Uri, content: string, overwrite: boolean): Promise<void> {
    const parent = vscode.Uri.joinPath(uri, '..');
    await vscode.workspace.fs.createDirectory(parent);
    if (!overwrite && await this.exists(uri)) {
      throw new Error(`Ya existe una nota con el identificador ${uri.path}.`);
    }

    const temporary = vscode.Uri.joinPath(parent, `.${uri.path.split('/').pop() ?? 'note'}.tmp-${randomUUID()}`);
    try {
      await vscode.workspace.fs.writeFile(temporary, new TextEncoder().encode(content));
      await vscode.workspace.fs.rename(temporary, uri, { overwrite });
    } finally {
      if (await this.exists(temporary)) {
        await vscode.workspace.fs.delete(temporary);
      }
    }
  }

  private async exists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private isFileNotFound(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'FileNotFound';
  }
}
