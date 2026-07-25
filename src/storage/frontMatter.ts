import type { Note } from './noteTypes';

export class NoteFormatError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'NoteFormatError';
  }
}

function valueForFrontMatter(value: string): string {
  return JSON.stringify(value);
}

function parseValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      throw new NoteFormatError(`Valor de front matter inválido: ${trimmed}`);
    }
  }
  return trimmed;
}

export function serializeNote(note: Omit<Note, 'fileUri'>): string {
  const fields = [
    `id: ${valueForFrontMatter(note.id)}`,
    `title: ${valueForFrontMatter(note.title)}`,
    `branch: ${valueForFrontMatter(note.branchName)}`,
    `branchKey: ${valueForFrontMatter(note.branchKey)}`,
    `repositoryId: ${valueForFrontMatter(note.repositoryId)}`,
    `workspaceId: ${valueForFrontMatter(note.workspaceId)}`,
    `createdAt: ${valueForFrontMatter(note.createdAt)}`,
    `modifiedAt: ${valueForFrontMatter(note.modifiedAt)}`
  ];
  return `---\n${fields.join('\n')}\n---\n\n${note.content.replace(/\r\n/g, '\n')}`;
}

export function parseNoteFile(text: string): Omit<Note, 'fileUri'> {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0] !== '---') {
    throw new NoteFormatError('La nota no contiene un front matter válido.');
  }

  const end = lines.indexOf('---', 1);
  if (end < 0) {
    throw new NoteFormatError('El front matter no está cerrado.');
  }

  const fields = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) {
      continue;
    }
    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new NoteFormatError(`Línea de front matter inválida: ${line}`);
    }
    fields.set(line.slice(0, separator).trim(), parseValue(line.slice(separator + 1)));
  }

  const required = ['id', 'title', 'branch', 'branchKey', 'repositoryId', 'workspaceId', 'createdAt', 'modifiedAt'];
  for (const field of required) {
    if (!fields.get(field)) {
      throw new NoteFormatError(`Falta el campo requerido: ${field}`);
    }
  }

  const content = lines.slice(end + 1).join('\n').replace(/^\n/, '');
  const note = {
    id: fields.get('id') as string,
    title: fields.get('title') as string,
    branchName: fields.get('branch') as string,
    branchKey: fields.get('branchKey') as string,
    repositoryId: fields.get('repositoryId') as string,
    workspaceId: fields.get('workspaceId') as string,
    createdAt: fields.get('createdAt') as string,
    modifiedAt: fields.get('modifiedAt') as string,
    content
  } satisfies Omit<Note, 'fileUri'>;

  if (Number.isNaN(Date.parse(note.createdAt)) || Number.isNaN(Date.parse(note.modifiedAt))) {
    throw new NoteFormatError('Las fechas de la nota no son válidas.');
  }
  return note;
}
