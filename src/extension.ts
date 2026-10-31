import * as vscode from "vscode";
import { mkdirSync } from "node:fs";
import * as path from "node:path";
import { ClaudeAgentProvider } from "./provider";
import { FeedbackTreeProvider } from "./feedbackView";
import { feedbackUrl, type FeedbackKind } from "./feedback";
import { resolveClaudeExecutable } from "./claudeExecutable";

export function activate(ctx: vscode.ExtensionContext): void {
  const log = vscode.window.createOutputChannel("Claude Agent SDK", { log: true });
  ctx.subscriptions.push(log);

  // Dedicated empty directory so the agent never works in a user's project by accident.
  const workDir = path.join(ctx.globalStorageUri.fsPath, "agent-cwd");
  mkdirSync(workDir, { recursive: true });

  const provider = new ClaudeAgentProvider(workDir, log, () => {
    const config = vscode.workspace.getConfiguration("claudeAgentLm");
    return {
      claudePath: resolveClaudeExecutable(
        config.get<string>("claudeExecutablePath", ""),
        process.env.PATH,
        process.platform,
        { localAppData: process.env.LOCALAPPDATA },
      ),
      effort: config.get<string>("effort", ""),
    };
  });

  ctx.subscriptions.push(
    provider,
    vscode.lm.registerLanguageModelChatProvider("claude-agent-sdk", provider),
    vscode.window.createTreeView("claudeAgentLmFeedback", {
      treeDataProvider: new FeedbackTreeProvider(),
    }),
    vscode.commands.registerCommand("claudeAgentLm.manage", () => log.show()),
    vscode.commands.registerCommand("claudeAgentLm.refreshModels", () => {
      provider.refreshModels();
      log.info("Model list refresh requested");
    }),
    vscode.commands.registerCommand("claudeAgentLm.reportBug", () => reportFeedback(ctx, "bug")),
    vscode.commands.registerCommand("claudeAgentLm.requestFeature", () => reportFeedback(ctx, "feature")),
  );
}

export function deactivate(): void {}

// Show exactly what will be sent, then open the issue form. Submission stays with the user.
async function reportFeedback(ctx: vscode.ExtensionContext, kind: FeedbackKind): Promise<void> {
  const bugsUrl = ctx.extension.packageJSON.bugs?.url as string | undefined;
  if (!bugsUrl) {
    void vscode.window.showErrorMessage("No feedback destination configured.");
    return;
  }
  const info = {
    extensionVersion: ctx.extension.packageJSON.version as string,
    vscodeVersion: vscode.version,
    platform: process.platform,
    arch: process.arch,
  };
  const url = feedbackUrl(bugsUrl, kind, info);
  const choice = await vscode.window.showInformationMessage(
    `Open the issue form with this metadata only?\n\n${url}`,
    { modal: true },
    "Open Issue Form",
  );
  if (choice === "Open Issue Form") {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }
}
