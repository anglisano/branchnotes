import type * as vscode from 'vscode';

export type BranchStatus = 'git' | 'detached' | 'no-git';

export interface BranchContext {
  status: BranchStatus;
  branchName: string;
  displayName: string;
  branchKey: string;
  repositoryId: string;
  repositoryRoot?: vscode.Uri;
  workspaceRoot: vscode.Uri;
}

export interface Note {
  id: string;
  title: string;
  branchName: string;
  branchKey: string;
  repositoryId: string;
  workspaceId: string;
  createdAt: string;
  modifiedAt: string;
  content: string;
  fileUri?: vscode.Uri;
}

export interface NoteInput {
  title: string;
  content: string;
}

export interface NoteListResult {
  notes: Note[];
  errors: string[];
}
