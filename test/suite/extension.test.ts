import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

describe('BranchNotes extension', () => {
  it('registers the MVP commands', async () => {
    await vscode.commands.executeCommand('branchnotes.openPanel');
    const commands = await vscode.commands.getCommands(true);
    for (const command of [
      'branchnotes.openPanel',
      'branchnotes.createNote',
      'branchnotes.editNote',
      'branchnotes.deleteNote',
      'branchnotes.protectNotes'
    ]) {
      assert.ok(commands.includes(command), `Missing command: ${command}`);
    }
  });
});
