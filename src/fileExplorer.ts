import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class GptExplorerProvider
  implements vscode.TreeDataProvider<ExplorerItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ExplorerItem | undefined | void
  > = new vscode.EventEmitter<ExplorerItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ExplorerItem | undefined | void> =
    this._onDidChangeTreeData.event;

  selectedFiles: Set<string> = new Set();

  constructor(
    private workspaceRoot: string,
    private context: vscode.ExtensionContext
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clearAll(): void {
    this.selectedFiles = new Set();
  }

  getTreeItem(element: ExplorerItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ExplorerItem): Thenable<ExplorerItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No folder open");
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getFilesAndFolders(element.resourceUri.fsPath)
      );
    } else {
      const workspaceRootPath = this.workspaceRoot;
      return Promise.resolve(this.getFilesAndFolders(workspaceRootPath));
    }
  }

  private getFilesAndFolders(folderPath: string): ExplorerItem[] {
    if (this.pathExists(folderPath)) {
      const children = fs.readdirSync(folderPath);
      return children
        .map((child) => {
          const childPath = path.join(folderPath, child);
          const isFile = fs.statSync(childPath).isFile();
          return new ExplorerItem(
            vscode.Uri.file(childPath),
            isFile ? path.basename(childPath) : child,
            isFile
              ? vscode.TreeItemCollapsibleState.None
              : vscode.TreeItemCollapsibleState.Collapsed,
            this.selectedFiles.has(childPath),
            isFile
          );
        })
        .sort((a, b) => {
          return (b.isFile ? 0 : 1) - (a.isFile ? 0 : 1);
        });
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }
}

export class ExplorerItem extends vscode.TreeItem {
  constructor(
    public readonly resourceUri: vscode.Uri,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    private readonly isSelected: boolean,
    public readonly isFile: boolean
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    // this.description = this.label;
    this.contextValue = isFile ? "gptExplorerItem" : "gptExplorerItemFolder";
    this.command = this.isFile
      ? {
          command: "builderAIAssistant.openFile",
          title: "Open File",
          arguments: [this]
        }
      : undefined;
    this.iconPath = this.getIconPath();
  }

  private getIconPath() {
    const iconBasePath = path.join(__filename, "..", "..", "resources", "icon");
    if (this.isFile) {
      return this.isSelected
        ? path.join(iconBasePath, "selected-file.svg")
        : path.join(iconBasePath, "file.svg");
    } else {
      return path.join(iconBasePath, "folder.svg");
    }
  }
}
