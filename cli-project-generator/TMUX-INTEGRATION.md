# Tmux Integration for Project Management

## Overview

The CLI now uses **tmux** for superior terminal session management instead of separate CMD windows. This provides better organization, cross-platform support, and professional development workflow.

## Benefits of Tmux Integration

### ✅ **Better Organization**

- Single session per project with multiple windows
- Easy switching between backend, frontend, and logs
- Session persistence across terminal closures

### ✅ **Cross-Platform Support**

- Works on Windows (with WSL/tmux), macOS, and Linux
- Consistent experience across all operating systems
- Fallback to CMD windows on Windows without tmux

### ✅ **Professional Workflow**

- Industry-standard terminal multiplexer
- Session management and restoration
- Background process handling

## Tmux Session Layout

When you create a project, tmux creates a session with this structure:

```
Session: {project-name}-dev
├── Window 0: backend    (NestJS development server)
├── Window 1: frontend   (Angular development server)
└── Window 2: logs       (Docker container logs)
```

## CLI Commands

### Create Project (with tmux)

```bash
node dist/index.js project my-app
```

- Creates project structure
- Sets up tmux session: `my-app-dev`
- Starts backend, frontend, and logs in separate windows
- Auto-attaches to the session

### Attach to Existing Project

```bash
node dist/index.js attach my-app
```

- Attaches to existing `my-app-dev` session
- If no session exists, offers to start servers

### Kill Project Session

```bash
node dist/index.js kill my-app
```

- Terminates the `my-app-dev` tmux session
- Stops all servers and processes

### List Active Sessions

```bash
node dist/index.js sessions
```

- Shows all active tmux sessions
- Equivalent to `tmux list-sessions`

### List Projects

```bash
node dist/index.js list
```

- Shows all generated projects
- Includes tmux command hints

## Tmux Keybindings

### Essential Commands

- **Detach**: `Ctrl+B, then D` - Leave session running in background
- **Switch Windows**: `Ctrl+B, then 0/1/2` - Navigate between backend/frontend/logs
- **List Windows**: `Ctrl+B, then W` - Show all windows in session
- **Create Window**: `Ctrl+B, then C` - Add new window
- **Rename Window**: `Ctrl+B, then ,` - Rename current window

### Manual Tmux Commands

```bash
# List all sessions
tmux list-sessions

# Attach to specific session
tmux attach-session -t my-app-dev

# Kill specific session
tmux kill-session -t my-app-dev

# Create new window in session
tmux new-window -t my-app-dev -n debug

# Send command to specific window
tmux send-keys -t my-app-dev:backend "npm run test" Enter
```

## Installation Requirements

### Windows

```bash
# Install via WSL or Chocolatey
choco install tmux
# OR use WSL2 with Ubuntu
wsl --install
```

### macOS

```bash
# Install via Homebrew
brew install tmux
```

### Linux

```bash
# Ubuntu/Debian
sudo apt-get install tmux

# CentOS/RHEL
sudo yum install tmux
```

## Fallback Behavior

If tmux is not available, the CLI automatically falls back to:

- Windows: Separate CMD windows (original behavior)
- Other OS: Background processes with manual log monitoring

## Example Workflow

### 1. Create Project

```bash
node dist/index.js project awesome-app
```

Output:

```
🚀 Starting development servers using tmux session...
✅ Development servers started in tmux session
📋 Tmux Session Layout:
   Session: awesome-app-dev
   • Window 0 (backend): NestJS development server
   • Window 1 (frontend): Angular development server
   • Window 2 (logs): Docker container logs

🔗 Attaching to tmux session...
```

### 2. Development Work

- **Window 0**: See NestJS server logs, run backend commands
- **Window 1**: See Angular build output, run frontend commands
- **Window 2**: Monitor database logs, run Docker commands

### 3. Session Management

```bash
# Detach but keep running
Ctrl+B, then D

# Reattach later
node dist/index.js attach awesome-app

# Stop everything
node dist/index.js kill awesome-app
```

## Advanced Usage

### Custom Windows

```bash
# Add debug window
tmux new-window -t awesome-app-dev -n debug
tmux send-keys -t awesome-app-dev:debug "cd backend && npm run test:watch" Enter

# Add database window
tmux new-window -t awesome-app-dev -n database
tmux send-keys -t awesome-app-dev:database "docker exec -it awesome-app-postgres psql -U postgres" Enter
```

### Session Sharing

```bash
# Multiple developers can attach to same session
tmux attach-session -t awesome-app-dev
```

### Configuration

Create `~/.tmux.conf` for custom settings:

```bash
# Enable mouse support
set -g mouse on

# Better colors
set -g default-terminal "screen-256color"

# Custom key bindings
bind-key r source-file ~/.tmux.conf \; display-message "Config reloaded"
```

The tmux integration provides a professional, organized development environment that scales with complex projects and teams!
