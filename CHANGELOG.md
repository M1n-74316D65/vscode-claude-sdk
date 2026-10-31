# Changelog

## 0.1.2

- New extension icon and activity bar icon.

## 0.1.1

- Windows: finds `claude.exe` from `winget install Anthropic.ClaudeCode`, with fallbacks to `%LOCALAPPDATA%\Microsoft\WinGet\Links` and `~/.local/bin` when PATH is stale.
- Ignores the npm `claude` shell shim on Windows.
- Bundle script no longer depends on shell quoting.

## 0.1.0

- Claude Opus 5.5, Sonnet 5.5, Haiku 5.5 in the Copilot Chat model picker, via the Claude Agent SDK.
- Image input, Copilot tool calling, `claudeAgentLm.effort` setting.
- Activity bar Feedback view and bug/feature commands with a metadata preview before opening the issue form.
- Requires VS Code 1.144.0 and a local Claude Code install.
