import * as vscode from "vscode";

class FeedbackItem extends vscode.TreeItem {
  constructor(label: string, commandId: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = commandId;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = { command: commandId, title: label };
  }
}

export class FeedbackTreeProvider implements vscode.TreeDataProvider<FeedbackItem> {
  getTreeItem(element: FeedbackItem): vscode.TreeItem {
    return element;
  }

  getChildren(): FeedbackItem[] {
    return [
      new FeedbackItem("Report a bug", "claudeAgentLm.reportBug", "bug"),
      new FeedbackItem("Request a feature", "claudeAgentLm.requestFeature", "lightbulb"),
    ];
  }
}
