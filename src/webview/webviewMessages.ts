import type { BranchContext, Note } from '../storage/noteTypes';

export interface NoteViewModel extends Omit<Note, 'fileUri'> {
  fileUri: string;
  contentHtml: string;
}

export interface PanelState {
  context: Pick<BranchContext, 'status' | 'displayName' | 'branchName'>;
  notes: NoteViewModel[];
  invalidFiles: number;
}

export type WebviewToExtension =
  | { type: 'create' }
  | { type: 'createTodos' }
  | { type: 'delete'; id: string }
  | { type: 'open'; id: string }
  | { type: 'refresh' };

export type ExtensionToWebview =
  | { type: 'state'; state: PanelState }
  | { type: 'error'; message: string };
