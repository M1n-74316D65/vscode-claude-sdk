# Claude Agent SDK for Copilot Chat

Adds Claude models (Sonnet, Opus, Haiku) backed by the Claude Agent SDK to the GitHub Copilot Chat model picker.

## Requirements

- VS Code 1.144.0 or newer with GitHub Copilot Chat.
- Claude Code installed and logged in (`claude` on PATH, or set `claudeAgentLm.claudeExecutablePath`). The extension does not bundle Claude Code.
- Authentication: Claude Code login, or `ANTHROPIC_API_KEY` in the environment that starts VS Code.

## Usage

1. Open the Copilot Chat model picker and choose **Manage Models…**, then **Claude Agent SDK**.
2. Select a Claude model.

Models: Claude Opus 5.5, Sonnet 5.5, Haiku 5.5 (1M input, 128K output). Image input and Copilot tool calling are supported.

Requests run without Claude Code's built-in tools (Read, Bash, Edit) and load no project or user settings files. Only tools supplied by Copilot can be called.

Setting `claudeAgentLm.effort` sets reasoning effort; empty uses the model default.

## Feedback

Use the **Claude Agent SDK** activity bar view, or run `Claude Agent SDK: Report a Bug` / `Request a Feature` from the Command Palette. The extension shows the exact metadata it will send (extension version, VS Code version, platform) before opening the issue form.

## Privacy

Chat messages are sent to Anthropic through the Claude Agent SDK. No telemetry is collected by this extension.
