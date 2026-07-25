import * as path from 'node:path';
import * as vscode from 'vscode';
import { branchKey } from '../storage/branchKey';
import type { BranchContext } from '../storage/noteTypes';

type GitHead = { name?: string; commit?: string };
type GitRepository = {
  rootUri: vscode.Uri;
  state: { HEAD?: GitHead; onDidChangeState?: vscode.Event<void> };
};
type GitApi = {
  repositories: GitRepository[];
  onDidChangeState?: vscode.Event<void>;
  getRepository?: (uri: vscode.Uri) => GitRepository | null;
};

export class BranchService {
  public async getCurrentContext(workspaceFolder: vscode.WorkspaceFolder): Promise<BranchContext> {
    const base = {
      workspaceRoot: workspaceFolder.uri,
      repositoryId: workspaceFolder.uri.toString()
    };
    const api = await this.getApi();
    if (!api) {
      return {
        ...base,
        status: 'no-git',
        branchName: 'Sin repositorio Git',
        displayName: 'Sin repositorio Git',
        branchKey: 'no-git'
      };
    }

    const repository = this.findRepository(api, workspaceFolder.uri);
    if (!repository) {
      return {
        ...base,
        status: 'no-git',
        branchName: 'Sin repositorio Git',
        displayName: 'Sin repositorio Git',
        branchKey: 'no-git'
      };
    }

    const head = repository.state.HEAD;
    const repositoryId = repository.rootUri.toString();
    if (head?.name) {
      return {
        ...base,
        status: 'git',
        branchName: head.name,
        displayName: head.name,
        branchKey: branchKey(head.name),
        repositoryId,
        repositoryRoot: repository.rootUri
      };
    }

    const commit = head?.commit ?? 'unknown';
    return {
      ...base,
      status: 'detached',
      branchName: commit,
      displayName: `HEAD separado (${commit.slice(0, 8)})`,
      branchKey: branchKey(`detached-${commit}`),
      repositoryId,
      repositoryRoot: repository.rootUri
    };
  }

  public watch(workspaceFolder: vscode.WorkspaceFolder | undefined, listener: () => void): vscode.Disposable {
    if (!workspaceFolder) {
      return new vscode.Disposable(() => undefined);
    }
    let disposed = false;
    const disposables: vscode.Disposable[] = [];
    void this.getApi().then((api) => {
      if (disposed || !api) {
        return;
      }
      if (api.onDidChangeState) {
        disposables.push(api.onDidChangeState(listener));
      }
      const repository = this.findRepository(api, workspaceFolder.uri);
      if (repository?.state.onDidChangeState) {
        disposables.push(repository.state.onDidChangeState(listener));
      }
    });

    return new vscode.Disposable(() => {
      disposed = true;
      vscode.Disposable.from(...disposables).dispose();
    });
  }

  private async getApi(): Promise<GitApi | undefined> {
    const extension = vscode.extensions.getExtension('vscode.git');
    if (!extension) {
      return undefined;
    }
    try {
      if (!extension.isActive) {
        await extension.activate();
      }
      const exports = extension.exports as { getAPI?: (version: number) => GitApi } | undefined;
      return exports?.getAPI?.(1);
    } catch {
      return undefined;
    }
  }

  private findRepository(api: GitApi, uri: vscode.Uri): GitRepository | undefined {
    const byApi = api.getRepository?.(uri);
    if (byApi) {
      return byApi;
    }
    return api.repositories.find((repository) => {
      const relative = path.relative(repository.rootUri.fsPath, uri.fsPath);
      return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
    });
  }
}
