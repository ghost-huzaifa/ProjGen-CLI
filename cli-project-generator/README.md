# Code Craft CLI Project Generator

A simple CLI tool to generate full-stack projects with Angular frontend and NestJS backend.

## Features

- 🚀 Creates complete full-stack projects
- 📁 Organized project structure (frontend/backend)
- 🐳 Automatic PostgreSQL Docker setup
- ⚙️ Environment configuration with port management
- 📦 Automatic dependency installation
- 🔥 Development server startup
- 🚫 Port conflict prevention

## Installation

```bash
cd cli-project-generator
yarn install
yarn build
```

## Usage

### Create a new project

```bash
yarn dev project my-awesome-app
```

### Create a project with custom ports

```bash
yarn dev project my-awesome-app --port 4000 --database-port 5433
```

### List existing projects

```bash
yarn dev list
```

## Project Structure

When you create a project called `my-app`, the following structure is created:

```
agen/gen-projects/my-app/
├── backend/          # NestJS backend
│   ├── src/
│   ├── prisma/
│   ├── .env          # Configured with project-specific settings
│   └── package.json
└── frontend/         # Angular frontend
    ├── src/
    ├── angular.json   # Configured with custom port
    └── package.json
```

## Port Management

- Backend runs on the specified port (default: 3000)
- Frontend runs on backend port + 1 (default: 3001)
- PostgreSQL runs on the specified database port (default: 5432)

## Environment Configuration

### Backend (.env)

- Database connection strings
- JWT secrets
- Application port
- Frontend URL for CORS

### Frontend (environment.ts)

- API URL pointing to backend
- Application URL

## Docker Setup

Each project gets its own PostgreSQL container:

- Container name: `{project-name}-postgres`
- Database: `{project-name}_db`
- CCS Database: `{project-name}_db_ccs`
- Default credentials: postgres/password

## Development Workflow

1. Create project: `yarn dev project my-app`
2. Wait for setup to complete
3. Access frontend: `http://localhost:3001`
4. Access backend: `http://localhost:3000`
5. Database is ready on port 5432

## Troubleshooting

### Docker Issues

Make sure Docker is running on your machine.

### Port Conflicts

Use custom ports when creating projects:

```bash
yarn dev project my-app --port 5000 --database-port 5433
```

### Dependencies

Make sure you have Node.js, Yarn, and Docker installed.
