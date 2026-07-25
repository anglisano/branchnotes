import { createHash } from 'node:crypto';

/** Converts a branch name into a safe, collision-resistant directory key. */
export function branchKey(branchName: string): string {
  const slug = branchName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'branch';
  const digest = createHash('sha256').update(branchName, 'utf8').digest('hex').slice(0, 12);
  return `${slug}-${digest}`;
}
