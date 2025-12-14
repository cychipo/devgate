# ProxyPal

Use your AI subscriptions (Claude, ChatGPT, Gemini, GitHub Copilot) with any coding tool. Native desktop app wrapping [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI).

![ProxyPal Dashboard](src/assets/dashboard.png)

## Features

- **Multiple AI Providers** - Connect Claude, ChatGPT, Gemini, Qwen, iFlow, Vertex AI, and custom OpenAI-compatible endpoints
- **GitHub Copilot Bridge** - Use Copilot models via OpenAI-compatible API
- **Antigravity Support** - Access thinking models through Antigravity proxy
- **Works Everywhere** - Cursor, Cline, Continue, Claude Code, OpenCode, and any OpenAI-compatible client
- **Usage Analytics** - Track requests, tokens, success rates, and estimated savings
- **Request Monitoring** - View all API requests with response times and status codes
- **Auto-Configure** - Detects installed CLI agents and sets them up automatically

## Quick Start

1. Download from [Releases](https://github.com/heyhuynhgiabuu/proxypal/releases)
2. Launch ProxyPal and start the proxy
3. Connect your AI accounts (OAuth or auth files)
4. Point your coding tool to `http://localhost:8317/v1`

### macOS Users

The app is not signed with an Apple Developer certificate yet. If macOS blocks the app, run:

```bash
xattr -cr /Applications/ProxyPal.app
```

Then open the app again.

## Supported Platforms

| Platform | Architecture          | Status |
| -------- | --------------------- | ------ |
| macOS    | Apple Silicon (ARM64) | ✅     |
| macOS    | Intel (x64)           | ✅     |
| Windows  | x64                   | ✅     |
| Linux    | x64 (.deb)            | ✅     |

## Development

```bash
pnpm install
pnpm tauri dev
```

## Tech Stack

- **Frontend**: SolidJS + TypeScript + Tailwind CSS
- **Backend**: Rust + Tauri v2
- **Proxy**: CLIProxyAPI (bundled)

## Contributing

We welcome contributions! Here's how to submit a good PR:

1. **One feature per PR** - Keep changes focused and atomic
2. **Clean commits** - Don't include unrelated changes (watch your lockfiles!)
3. **Rebase before submitting** - Ensure no merge conflicts with main
4. **Test your changes** - Run `pnpm tauri dev` and verify functionality
5. **Follow existing patterns** - Check how similar features are implemented

### Adding a New Agent

If adding support for a new coding agent:

- Add detection logic in `src-tauri/src/lib.rs`
- Add logo to `public/logos/` (use `currentColor` for dark mode support)
- Update the agents array in relevant components
- Test the auto-configuration flow

### Code Style

- **TypeScript**: Follow existing patterns, use `type` imports
- **Rust**: Use `cargo check` before committing
- **Commits**: Clear, descriptive messages

## Support

If you find ProxyPal useful, consider [buying me a coffee](https://buymeacoffee.com/heyhuynhgiabuu).

## License

MIT
