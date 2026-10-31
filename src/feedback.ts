export type FeedbackKind = "bug" | "feature";

export interface FeedbackInfo {
  extensionVersion: string;
  vscodeVersion: string;
  platform: string;
  arch: string;
}

// Only non-sensitive build metadata. Never prompts, logs, paths or secrets.
export function feedbackBody(kind: FeedbackKind, info: FeedbackInfo): string {
  const label = kind === "bug" ? "Bug report" : "Feature request";
  return [
    `${label}`,
    "",
    `- Extension: ${info.extensionVersion}`,
    `- VS Code: ${info.vscodeVersion}`,
    `- Platform: ${info.platform} ${info.arch}`,
    "",
    "Describe the problem or idea:",
    "",
  ].join("\n");
}

export function feedbackUrl(bugsUrl: string, kind: FeedbackKind, info: FeedbackInfo): string {
  const url = new URL(bugsUrl);
  url.searchParams.set("title", kind === "bug" ? "[Bug] " : "[Feature] ");
  url.searchParams.set("body", feedbackBody(kind, info));
  return url.toString();
}
