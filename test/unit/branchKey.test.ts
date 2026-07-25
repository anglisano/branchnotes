import assert from 'node:assert/strict';
import { branchKey } from '../../src/storage/branchKey';

describe('branchKey', () => {
  it('creates safe keys for slash-separated branches', () => {
    const key = branchKey('feature/login');
    assert.match(key, /^[a-z0-9-]+$/);
    assert.notEqual(key, branchKey('feature-login'));
  });

  it('keeps spaces and Unicode safe while remaining deterministic', () => {
    assert.equal(branchKey('Éxito / revisión'), branchKey('Éxito / revisión'));
    assert.match(branchKey('Éxito / revisión'), /^[a-z0-9-]+$/);
    assert.notEqual(branchKey('release one'), branchKey('release two'));
  });
});
