import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { ProjectEnvHelper } from "../utils/project-env-helper";

const execAsync = promisify(exec);

export interface ProjectOptions {
  startPort?: number;
  dbPort?: number;
}

export class ProjectGenerator {
  private readonly projectsDir: string;
  private readonly templatesDir: string;
  private readonly envHelper: ProjectEnvHelper;

  constructor() {
    // Navigate from cli-project-generator to the gen-projects directory
    this.projectsDir = path.resolve(__dirname, "../../../../../gen-projects");
    // Navigate from dist/generators/ to 006-cc-cli/templates/
    this.templatesDir = path.resolve(__dirname, "../../../templates");
    this.envHelper = ProjectEnvHelper.getInstance();
  }

  async createProject(
    projectName: string,
    options: ProjectOptions
  ): Promise<void> {
    const projectPath = path.join(this.projectsDir, projectName);

    // Check if project already exists
    if (await fs.pathExists(projectPath)) {
      throw new Error(`Project ${projectName} already exists!`);
    }

    // Get smart port allocation
    const availablePorts = this.envHelper.getNextAvailablePorts();
    const backendPort = options.startPort || availablePorts.backend;
    const frontendPort = backendPort + 1;
    const dbPort = options.dbPort || availablePorts.database;

    console.log(chalk.yellow("📁 Creating project directory..."));
    await fs.ensureDir(projectPath);

    // Create backend and frontend directories
    const backendPath = path.join(projectPath, "backend");
    const frontendPath = path.join(projectPath, "frontend");

    console.log(chalk.yellow("📋 Copying backend template..."));
    await this.copyTemplate("backend", backendPath);

    console.log(chalk.yellow("📋 Copying frontend template..."));
    await this.copyTemplate("frontend", frontendPath);

    console.log(chalk.yellow("⚙️  Configuring environment variables..."));
    await this.configureBackendEnv(
      backendPath,
      projectName,
      backendPort,
      dbPort
    );
    await this.configureFrontendEnv(frontendPath, frontendPort, backendPort);

    console.log(chalk.yellow("🐳 Setting up PostgreSQL Docker container..."));
    await this.setupDatabase(projectName, dbPort);

    // Wait a bit longer to ensure database is fully ready before migration
    console.log(chalk.blue("⏳ Waiting for database to be fully ready..."));
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log(chalk.yellow("📦 Installing dependencies..."));
    await this.installDependencies(backendPath, frontendPath);

    console.log(chalk.yellow("🚀 Starting development servers..."));
    await this.startServers(backendPath, frontendPath, projectName);

    this.displayProjectInfo(projectName, frontendPort, backendPort, dbPort);
  }

  private async copyTemplate(
    templateName: string,
    targetPath: string
  ): Promise<void> {
    const templatePath = path.join(this.templatesDir, templateName);
    await fs.copy(templatePath, targetPath);
  }

  private async configureBackendEnv(
    backendPath: string,
    projectName: string,
    backendPort: number,
    dbPort: number
  ): Promise<void> {
    const envPath = path.join(backendPath, ".env");
    const dbName = `${projectName}_db`;

    const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:${dbPort}/${dbName}?schema=public"
CCS_DATABASE_URL="postgresql://postgres:password@localhost:${dbPort}/${dbName}_ccs?schema=public"
CCS_MODE=development

# JWT
JWT_SECRET="${projectName}-jwt-secret"
JWT_ACCESS_SECRET="${projectName}-jwt-access-secret"
JWT_REFRESH_SECRET="${projectName}-jwt-refresh-secret"
JWT_ACCESS_EXPIRATION="1y"
JWT_REFRESH_EXPIRATION="60s"

#Auth Cookie Configuration
AUTH_COOKIE_NAME="AccessToken"
AUTH_COOKIE_SECRET="${projectName.toUpperCase()}_AUTH_COOKIE_SECRET"
AUTH_COOKIE_DOMAIN="localhost"
LANGBASE_API_KEY="${projectName}-lang-api-key"
CORS_ALLOWED_ORIGINS="http://localhost:${backendPort + 1}"

# Application
PORT=${backendPort}
NODE_ENV=development
URL_PREFIX="apis/v1"
PROJECT_NAME="${projectName}"
FRONTEND_URL="http://localhost:${backendPort + 1}"
`;

    await fs.writeFile(envPath, envContent);

    // Update schema.prisma to use PostgreSQL instead of MySQL
    // const schemaPath = path.join(backendPath, "prisma", "schema.prisma");
    // if (await fs.pathExists(schemaPath)) {
    //   let schemaContent = await fs.readFile(schemaPath, "utf-8");
    //   schemaContent = schemaContent.replace(
    //     'provider = "mysql"',
    //     'provider = "postgresql"'
    //   );
    //   await fs.writeFile(schemaPath, schemaContent);
    //   console.log(chalk.green("✅ Updated schema.prisma to use PostgreSQL"));
    // }

    // Remove existing migrations folder to avoid conflicts
    // const migrationsPath = path.join(backendPath, "prisma", "migrations");
    // if (await fs.pathExists(migrationsPath)) {
    //   await fs.remove(migrationsPath);
    //   console.log(chalk.green("✅ Removed existing MySQL migrations"));
    // }
  }

  private async configureFrontendEnv(
    frontendPath: string,
    frontendPort: number,
    backendPort: number
  ): Promise<void> {
    // Create environment file for Angular
    const envDir = path.join(frontendPath, "src", "environments");
    await fs.ensureDir(envDir);

    const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:${backendPort}',
  appUrl: 'http://localhost:${frontendPort}'
};
`;

    await fs.writeFile(path.join(envDir, "environment.ts"), envContent);
    await fs.writeFile(
      path.join(envDir, "environment.development.ts"),
      envContent
    );

    // Update angular.json to use the correct port
    const angularJsonPath = path.join(frontendPath, "angular.json");
    if (await fs.pathExists(angularJsonPath)) {
      const angularJson = await fs.readJson(angularJsonPath);
      if (
        angularJson.projects &&
        Object.keys(angularJson.projects).length > 0
      ) {
        const projectName = Object.keys(angularJson.projects)[0];
        if (angularJson.projects[projectName].architect?.serve?.options) {
          angularJson.projects[projectName].architect.serve.options.port =
            frontendPort;
        }
      }
      await fs.writeJson(angularJsonPath, angularJson, { spaces: 2 });
    }
  }

  private async setupDatabase(
    projectName: string,
    dbPort: number
  ): Promise<void> {
    const containerName = `${projectName}-postgres`;
    const dbName = `${projectName}_db`;

    try {
      // Check if container already exists
      console.log(
        chalk.gray(`🔄 Checking for existing container: ${containerName}`)
      );
      const existingContainer = await execAsync(
        `docker ps -a --filter name=${containerName} --format "{{.Names}}"`
      );

      if (existingContainer.stdout.trim()) {
        console.log(
          chalk.blue(
            `Container ${containerName} already exists, stopping and removing...`
          )
        );
        await this.execWithLogs(
          `docker stop ${containerName}`,
          process.cwd(),
          "Docker Stop"
        );
        await this.execWithLogs(
          `docker rm ${containerName}`,
          process.cwd(),
          "Docker Remove"
        );
      }
    } catch (error) {
      console.log(chalk.gray("No existing container found, continuing..."));
    }

    // Create and start PostgreSQL container
    const dockerCommand = `docker run -d --name ${containerName} -e POSTGRES_PASSWORD=password -e POSTGRES_DB=${dbName} -p ${dbPort}:5432 postgres:15-alpine`;
    console.log(
      chalk.gray(`🔄 Creating PostgreSQL container: ${dockerCommand}`)
    );
    await this.execWithLogs(dockerCommand, process.cwd(), "Docker Create");

    // Wait a bit for the database to be ready
    console.log(chalk.blue("Waiting for database to be ready..."));
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test database connection
    try {
      await this.execWithLogs(
        `docker exec ${containerName} pg_isready -U postgres`,
        process.cwd(),
        "Database Ready Check"
      );
      console.log(chalk.green("✅ Database is ready"));
    } catch (error) {
      console.log(chalk.yellow("⚠️  Database might still be starting up..."));
    }

    // Create additional database for CCS
    try {
      await this.execWithLogs(
        `docker exec ${containerName} createdb -U postgres ${dbName}_ccs`,
        process.cwd(),
        "CCS Database Creation"
      );
      console.log(chalk.green("✅ CCS database created"));
    } catch (error) {
      console.log(
        chalk.yellow("CCS database might already exist, continuing...")
      );
    }
  }

  private async installDependencies(
    backendPath: string,
    frontendPath: string
  ): Promise<void> {
    console.log(chalk.blue("Installing backend dependencies..."));
    const backendInstall = await this.execWithLogs(
      "yarn install",
      backendPath,
      "Backend Dependencies"
    );

    console.log(chalk.blue("Running Prisma migration..."));
    try {
      // Generate Prisma client first
      await this.execWithLogs(
        "yarn prisma generate",
        backendPath,
        "Prisma Generate"
      );

      // Run the migration
      const migrationResult = await this.execWithLogs(
        "yarn prisma migrate dev --name initial_migration",
        backendPath,
        "Prisma Migration"
      );
      console.log(chalk.green("✅ Prisma migration completed successfully"));

      // Run prisma seed
      console.log(chalk.blue("Running database seed..."));
      await this.execWithLogs("yarn prisma:seed", backendPath, "Database Seed");
      console.log(chalk.green("✅ Database seeding completed successfully"));
    } catch (error: any) {
      console.error(chalk.red("❌ Prisma migration failed:"));
      if (error.stdout) console.log(chalk.yellow("STDOUT:"), error.stdout);
      if (error.stderr) console.log(chalk.red("STDERR:"), error.stderr);
      console.log(chalk.yellow("⚠️  Continuing with project setup..."));
    }

    console.log(chalk.blue("Installing frontend dependencies..."));
    await this.execWithLogs(
      "yarn install",
      frontendPath,
      "Frontend Dependencies"
    );
  }

  private async execWithLogs(
    command: string,
    cwd: string,
    label: string
  ): Promise<any> {
    console.log(chalk.gray(`🔄 ${label}: ${command}`));
    try {
      const result = await execAsync(command, { cwd });
      if (result.stdout) {
        console.log(chalk.cyan(`📝 ${label} Output:`));
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.log(chalk.yellow(`⚠️  ${label} Warnings:`));
        console.log(result.stderr);
      }
      return result;
    } catch (error: any) {
      console.error(chalk.red(`❌ ${label} Failed:`));
      if (error.stdout) console.log(chalk.yellow("STDOUT:"), error.stdout);
      if (error.stderr) console.log(chalk.red("STDERR:"), error.stderr);
      throw error;
    }
  }

  private async startServers(
    backendPath: string,
    frontendPath: string,
    projectName: string
  ): Promise<void> {
    console.log(
      chalk.blue("🚀 Starting development servers using tmux session...")
    );

    const sessionName = `${projectName}-dev`;

    try {
      // Check if tmux is available
      await execAsync("tmux -V");
    } catch (error) {
      console.log(
        chalk.yellow(
          "⚠️  tmux not found, falling back to separate CMD windows..."
        )
      );
      return this.startServersWindows(backendPath, frontendPath, projectName);
    }

    try {
      // Kill existing session if it exists
      await execAsync(`tmux kill-session -t ${sessionName}`);
      console.log(chalk.gray(`Killed existing tmux session: ${sessionName}`));
    } catch (error) {
      // Session doesn't exist, which is fine
    }

    // Create new tmux session with backend
    const createSessionCommand = `tmux new-session -d -s ${sessionName} -n backend`;
    await this.execWithLogs(
      createSessionCommand,
      process.cwd(),
      "Tmux Session Creation"
    );

    // Start backend in the first window
    const backendStartCommand = `tmux send-keys -t ${sessionName}:backend "cd '${backendPath}' && yarn start:dev" Enter`;
    await this.execWithLogs(
      backendStartCommand,
      process.cwd(),
      "Backend Start Command"
    );

    // Create new window for frontend
    const frontendWindowCommand = `tmux new-window -t ${sessionName} -n frontend`;
    await this.execWithLogs(
      frontendWindowCommand,
      process.cwd(),
      "Frontend Window Creation"
    );

    // Start frontend in the second window
    const frontendStartCommand = `tmux send-keys -t ${sessionName}:frontend "cd '${frontendPath}' && yarn start" Enter`;
    await this.execWithLogs(
      frontendStartCommand,
      process.cwd(),
      "Frontend Start Command"
    );

    // Create a logs window for monitoring
    const logsWindowCommand = `tmux new-window -t ${sessionName} -n logs`;
    await this.execWithLogs(
      logsWindowCommand,
      process.cwd(),
      "Logs Window Creation"
    );

    // Setup logs window with panes for docker and general info
    const dockerLogsCommand = `tmux send-keys -t ${sessionName}:logs "docker logs -f ${projectName}-postgres 2>/dev/null || echo 'Docker container not ready yet...'" Enter`;
    await this.execWithLogs(
      dockerLogsCommand,
      process.cwd(),
      "Docker Logs Setup"
    );

    console.log(chalk.green("✅ Development servers started in tmux session"));
    console.log(chalk.cyan("📋 Tmux Session Layout:"));
    console.log(chalk.white(`   Session: ${sessionName}`));
    console.log(
      chalk.white(`   • Window 0 (backend): NestJS development server`)
    );
    console.log(
      chalk.white(`   • Window 1 (frontend): Angular development server`)
    );
    console.log(chalk.white(`   • Window 2 (logs): Docker container logs`));

    // Attach to the session
    console.log(chalk.blue("\n🔗 Attaching to tmux session..."));
    console.log(chalk.gray("To detach: Ctrl+B, then D"));
    console.log(chalk.gray("To switch windows: Ctrl+B, then 0/1/2"));
    console.log(
      chalk.gray("To kill session: tmux kill-session -t " + sessionName)
    );

    // Attach to the session (this will take over the terminal)
    setTimeout(async () => {
      try {
        const attachCommand = `tmux attach-session -t ${sessionName}`;
        await this.execWithLogs(attachCommand, process.cwd(), "Tmux Attach");
      } catch (error) {
        console.log(chalk.yellow("Could not auto-attach to tmux session."));
        console.log(
          chalk.cyan(
            `Manually attach with: tmux attach-session -t ${sessionName}`
          )
        );
      }
    }, 1000);
  }

  private async startServersWindows(
    backendPath: string,
    frontendPath: string,
    projectName: string
  ): Promise<void> {
    // Fallback to CMD windows for Windows systems without tmux
    console.log(
      chalk.blue("Starting development servers in separate CMD windows...")
    );

    // Start backend in new terminal window
    const backendCommand = `start "Backend - ${projectName}" cmd /k "cd /d "${backendPath}" && yarn start:dev"`;
    console.log(chalk.gray(`🔄 Backend Terminal: ${backendCommand}`));
    exec(backendCommand, (error) => {
      if (error) {
        console.error(chalk.red(`Backend terminal error: ${error}`));
      }
    });

    // Wait a bit before starting frontend
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start frontend in new terminal window
    const frontendCommand = `start "Frontend - ${projectName}" cmd /k "cd /d "${frontendPath}" && yarn start"`;
    console.log(chalk.gray(`🔄 Frontend Terminal: ${frontendCommand}`));
    exec(frontendCommand, (error) => {
      if (error) {
        console.error(chalk.red(`Frontend terminal error: ${error}`));
      }
    });

    console.log(
      chalk.green("✅ Development servers started in separate terminal windows")
    );
    console.log(chalk.cyan("📋 Terminal Windows:"));
    console.log(chalk.white(`   • Backend - ${projectName} (NestJS)`));
    console.log(chalk.white(`   • Frontend - ${projectName} (Angular)`));
  }

  private displayProjectInfo(
    projectName: string,
    frontendPort: number,
    backendPort: number,
    dbPort: number
  ): void {
    console.log(chalk.green.bold("\n🎉 Project Setup Complete!"));
    console.log(chalk.cyan("📊 Project Information:"));
    console.log(chalk.white(`   Name: ${projectName}`));
    console.log(chalk.white(`   Frontend: http://localhost:${frontendPort}`));
    console.log(chalk.white(`   Backend: http://localhost:${backendPort}`));
    console.log(
      chalk.white(`   Swagger: http://localhost:${backendPort}/apis/v1/swagger`)
    );
    console.log(chalk.white(`   Database: PostgreSQL on port ${dbPort}`));
    console.log(chalk.white(`   Container: ${projectName}-postgres`));

    console.log(chalk.cyan("\n🖥️  Development Environment:"));
    console.log(chalk.white(`   • Tmux Session: ${projectName}-dev`));
    console.log(chalk.white(`   • Backend Window: ${projectName}-dev:backend`));
    console.log(
      chalk.white(`   • Frontend Window: ${projectName}-dev:frontend`)
    );
    console.log(chalk.white(`   • Logs Window: ${projectName}-dev:logs`));

    console.log(chalk.cyan("\n📋 Tmux Commands:"));
    console.log(
      chalk.gray(`   • Attach: tmux attach-session -t ${projectName}-dev`)
    );
    console.log(chalk.gray(`   • Detach: Ctrl+B, then D`));
    console.log(chalk.gray(`   • Switch windows: Ctrl+B, then 0/1/2`));
    console.log(
      chalk.gray(`   • Kill session: tmux kill-session -t ${projectName}-dev`)
    );
    console.log(chalk.gray(`   • List sessions: tmux list-sessions`));

    console.log(
      chalk.yellow("\n⚡ The tmux session will start automatically!")
    );
    console.log(
      chalk.gray(
        "💡 If tmux is not available, fallback CMD windows will be used."
      )
    );

    console.log(chalk.green.bold("\n🚀 Happy coding!"));
  }

  listProjects(): void {
    try {
      const projects = fs
        .readdirSync(this.projectsDir)
        .filter((item: string) => {
          const fullPath = path.join(this.projectsDir, item);
          return (
            fs.statSync(fullPath).isDirectory() && item !== ".env-code-craft"
          );
        });

      if (projects.length === 0) {
        console.log(chalk.yellow("No projects found."));
        return;
      }

      console.log(chalk.blue.bold("📁 Generated Projects:"));
      projects.forEach((project: string, index: number) => {
        const config = this.envHelper.getProjectConfig(project);
        if (config) {
          console.log(
            chalk.white(
              `   ${index + 1}. ${project} (Frontend: ${
                config.frontendPort
              }, Backend: ${config.backendPort})`
            )
          );
        } else {
          console.log(chalk.white(`   ${index + 1}. ${project}`));
        }
      });

      console.log(chalk.cyan("\n📋 Tmux Commands:"));
      console.log(chalk.gray("   • List sessions: tmux list-sessions"));
      console.log(
        chalk.gray(
          "   • Attach to project: tmux attach-session -t {project-name}-dev"
        )
      );
      console.log(
        chalk.gray(
          "   • Kill project session: tmux kill-session -t {project-name}-dev"
        )
      );
    } catch (error) {
      console.error(chalk.red("Error listing projects:", error));
    }
  }

  async attachToProject(projectName: string): Promise<void> {
    const sessionName = `${projectName}-dev`;

    try {
      // Check if tmux is available
      await execAsync("tmux -V");
    } catch (error) {
      throw new Error("tmux is not available on this system");
    }

    try {
      // Check if session exists
      await execAsync(`tmux has-session -t ${sessionName}`);

      console.log(
        chalk.blue(`🔗 Attaching to existing tmux session: ${sessionName}`)
      );
      console.log(chalk.gray("To detach: Ctrl+B, then D"));

      // Attach to the session
      await execAsync(`tmux attach-session -t ${sessionName}`);
    } catch (error) {
      console.log(
        chalk.yellow(`No active tmux session found for project: ${projectName}`)
      );
      console.log(
        chalk.cyan("Would you like to start the development servers?")
      );

      // Check if project exists
      const projectPath = path.join(this.projectsDir, projectName);
      if (!(await fs.pathExists(projectPath))) {
        throw new Error(`Project ${projectName} does not exist!`);
      }

      // Start servers for existing project
      const backendPath = path.join(projectPath, "backend");
      const frontendPath = path.join(projectPath, "frontend");

      await this.startServers(backendPath, frontendPath, projectName);
    }
  }

  async killProjectSession(projectName: string): Promise<void> {
    const sessionName = `${projectName}-dev`;

    try {
      await execAsync(`tmux kill-session -t ${sessionName}`);
      console.log(chalk.green(`✅ Killed tmux session: ${sessionName}`));
    } catch (error) {
      console.log(
        chalk.yellow(`No active tmux session found for project: ${projectName}`)
      );
    }
  }
}
