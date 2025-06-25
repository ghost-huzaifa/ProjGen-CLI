# Quick Start Guide

## Installation

1. Navigate to the CLI directory:

```bash
cd c:\dev\code-craft\agen\generators\006-cc-cli\cli-project-generator
```

2. Install dependencies:

```bash
yarn install
```

3. Build the project:

```bash
yarn build
```

## Usage

### Create a new project (automatic port allocation)

```bash
node dist/index.js project my-awesome-app
```

### Create a project with specific ports

```bash
node dist/index.js project my-app --port 4000 --database-port 5433
```

### List existing projects

```bash
node dist/index.js list
```

### Using the Windows batch file

```bash
cc-create.bat project my-app
cc-create.bat list
```

## What happens when you create a project?

1. **Project Structure Created**:

   ```
   agen/gen-projects/my-app/
   ├── backend/     # NestJS backend (copied from templates/backend)
   └── frontend/    # Angular frontend (copied from templates/frontend)
   ```

2. **Port Configuration**:

   - Backend: Starts at port 3000 (or specified port)
   - Frontend: Backend port + 1 (e.g., 3001)
   - Database: Port 5432 (or specified port)

3. **Environment Setup**:

   - Backend `.env` configured with database URL, JWT secrets, etc.
   - Frontend environment files configured with API URLs

4. **Docker Database**:

   - PostgreSQL container created: `{project-name}-postgres`
   - Main database: `{project-name}_db`
   - CCS database: `{project-name}_db_ccs`

5. **Dependencies & Servers**:
   - `yarn install` run for both frontend and backend
   - `yarn start:dev` for backend (NestJS development mode)
   - `yarn start` for frontend (Angular development mode)

## Example Output

```bash
$ node dist/index.js project test-app

🚀 Creating project: test-app
📁 Creating project directory...
📋 Copying backend template...
📋 Copying frontend template...
⚙️  Configuring environment variables...
🐳 Setting up PostgreSQL Docker container...
📦 Installing dependencies...
🚀 Starting development servers...

🎉 Project Setup Complete!
📊 Project Information:
   Name: test-app
   Frontend: http://localhost:3001
   Backend: http://localhost:3000
   Database: PostgreSQL on port 5432

⚡ Servers are starting up... Please wait a moment for them to be fully ready.
💡 Tip: You can check the logs in the respective project directories.
```

## Requirements

- Node.js (v16+)
- Yarn
- Docker (for PostgreSQL containers)
- Windows (batch file support)

## Smart Features

- **Port Conflict Prevention**: Automatically finds available ports
- **Multiple Projects**: Run multiple projects simultaneously
- **Environment Isolation**: Each project has its own database container
- **Template Copying**: Preserves all template files and structure
- **Development Ready**: Projects start in development mode, not production
