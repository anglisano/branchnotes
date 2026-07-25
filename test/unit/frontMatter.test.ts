import assert from 'node:assert/strict';
import { parseNoteFile, serializeNote } from '../../src/storage/frontMatter';
import type { Note } from '../../src/storage/noteTypes';

describe('note front matter', () => {
  const note: Omit<Note, 'fileUri'> = {
    id: 'note-1',
    title: 'Título: importante',
    branchName: 'feature/login',
    branchKey: 'feature-login-123',
    repositoryId: 'repo',
    workspaceId: 'workspace',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-02T00:00:00.000Z',
    content: '# Encabezado\n\n<script>alert(1)</script>'
  };

  it('round-trips metadata and Markdown content', () => {
    assert.deepEqual(parseNoteFile(serializeNote(note)), note);
  });

  it('rejects malformed files', () => {
    assert.throws(() => parseNoteFile('# no metadata'), /front matter válido/);
    assert.throws(() => parseNoteFile('---\nid: "only-id"\n---\n'), /Falta el campo requerido/);
  });
});
