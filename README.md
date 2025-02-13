# IWA Launcher

IWA Launcher is a desktop application designed to simplify the experience of running Isolated Web Apps (IWAs) locally. It aims to unlock user agency through controlled frames and local-first applications, making IWAs more accessible to developers and users.

## Current Features

- ✅ Auto-start with system boot
- ✅ Automatic updates via CrabNebula CDN
- ✅ Basic Chrome launching capabilities
- ✅ Dedicated Chrome profile management for IWAs
- ✅ Bun sidecar bundled 
- ✅ Git support (for cloning repos)
- WIP - Support for `.swbn` and `.wbn` file associations
- WIP - Cross-platform support (macOS, Windows, Linux) - currently only macOS

## Planned Features

- Installation of IWAs from files and URLs (dev mode)
- IWA management and tracking
- Shortcut management
- IWA verification and security features
- Chrome extension integration
- Community-curated IWA list
- Boot-time IWA launching
- Source-based IWA building
- IWA update management

## Development Setup

1. Install dependencies:
```bash
bun install
```

2. Start the development environment:
```bash
bun tauri dev
```

## Latest Release

You can download the latest release from our [GitHub Releases](https://github.com/Xe/iwa-launcher/releases/latest) page.

## Project Status

This project is currently in active development. While core features like auto-start and updates are working, many planned features for IWA management are still in development. The current focus is on establishing a stable foundation for the launcher before implementing the full IWA installation and management capabilities.

## Requirements

- Bun (for development)
- Rust toolchain (for Tauri)
- Chrome/Chromium (for running IWAs)

## Contributing

Contributions are welcome! Check the TODO list in the repository for areas where help is needed.

To get involved checkour https://userandagents.com and join the discord

## License

MIT

