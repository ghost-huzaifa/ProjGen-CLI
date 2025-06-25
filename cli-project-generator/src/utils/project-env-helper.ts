import * as path from "path";
import * as fs from "fs";

export interface ProjectConfig {
  name: string;
  frontendPort: number;
  backendPort: number;
  databasePort: number;
  projectPath: string;
}

export class ProjectEnvHelper {
  private static instance: ProjectEnvHelper;
  private readonly projectsDir: string;

  private constructor() {
    // Points to agen/gen-projects directory
    this.projectsDir = path.resolve(__dirname, "../../../../../gen-projects");
  }

  public static getInstance(): ProjectEnvHelper {
    if (!ProjectEnvHelper.instance) {
      ProjectEnvHelper.instance = new ProjectEnvHelper();
    }
    return ProjectEnvHelper.instance;
  }

  public getNextAvailablePorts(): {
    backend: number;
    frontend: number;
    database: number;
  } {
    const existingProjects = this.getExistingProjects();
    let basePort = 3000;
    let dbPort = 5432;

    // Find the highest used port and increment
    existingProjects.forEach((project) => {
      const config = this.getProjectConfig(project);
      if (config) {
        basePort = Math.max(basePort, config.backendPort + 2);
        dbPort = Math.max(dbPort, config.databasePort + 1);
      }
    });

    return {
      backend: basePort,
      frontend: basePort + 1,
      database: dbPort,
    };
  }

  public getExistingProjects(): string[] {
    try {
      return fs.readdirSync(this.projectsDir).filter((item) => {
        const fullPath = path.join(this.projectsDir, item);
        return (
          fs.statSync(fullPath).isDirectory() &&
          item !== ".env-code-craft" &&
          this.isValidProject(item)
        );
      });
    } catch (error) {
      return [];
    }
  }

  private isValidProject(projectName: string): boolean {
    const projectPath = path.join(this.projectsDir, projectName);
    const backendPath = path.join(projectPath, "backend");
    const frontendPath = path.join(projectPath, "frontend");

    return fs.existsSync(backendPath) && fs.existsSync(frontendPath);
  }

  public getProjectConfig(projectName: string): ProjectConfig | null {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const backendEnvPath = path.join(projectPath, "backend", ".env");

      if (!fs.existsSync(backendEnvPath)) {
        return null;
      }

      const envContent = fs.readFileSync(backendEnvPath, "utf-8");
      const portMatch = envContent.match(/PORT=(\d+)/);
      const dbUrlMatch = envContent.match(/localhost:(\d+)\//);

      if (!portMatch || !dbUrlMatch) {
        return null;
      }

      const backendPort = parseInt(portMatch[1]);
      const databasePort = parseInt(dbUrlMatch[1]);

      return {
        name: projectName,
        backendPort,
        frontendPort: backendPort + 1,
        databasePort,
        projectPath,
      };
    } catch (error) {
      return null;
    }
  }

  //   public createProjectEnvFile(
  //     projectName: string,
  //     config: ProjectConfig
  //   ): void {
  //     const envPath = path.join(this.projectsDir, ".env-code-craft");
  //     const envContent = `# Project Configuration
  // PROJECT_NAME=${projectName}
  // ACTIVE_PROJ=${projectName}

  // # Project Paths
  // PROJECT_PATH=./gen-projects/\${PROJECT_NAME}
  // SCHEMA_PATH=\${PROJECT_PATH}/specs/schema.prisma
  // GENERATED_CODE_PATH=\${PROJECT_PATH}/generated/nestjs
  // GENERATED_ANGULAR_CODE_PATH=\${PROJECT_PATH}/generated/angular

  // # Module Configuration
  // BASE_MODULE_PATH=src/modules

  // # Features
  // ENABLE_ERD=true
  // ENABLE_DOCS=true

  // # Port Configuration
  // BACKEND_PORT=${config.backendPort}
  // FRONTEND_PORT=${config.frontendPort}
  // DATABASE_PORT=${config.databasePort}
  // `;

  //     fs.writeFileSync(envPath, envContent);
  //   }

  public getProjectsDir(): string {
    return this.projectsDir;
  }
}
