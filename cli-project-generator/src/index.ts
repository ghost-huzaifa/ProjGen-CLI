#!/usr/bin/env node

import { Command } from "commander";
import { ProjectGenerator } from "./generators/project-generator";
import chalk from "chalk";

const program = new Command();

program
  .name("cc-create")
  .description(
    "CLI tool to generate full-stack projects with Angular frontend and NestJS backend"
  )
  .version("1.0.0");

program
  .command("project <name>")
  .description("Create a new full-stack project")
  .option(
    "-p, --port <port>",
    "Starting port number for backend (frontend will be port+1)"
  )
  .option("-d, --database-port <port>", "Database port")
  .action(
    async (name: string, options: { port?: string; databasePort?: string }) => {
      try {
        console.log(chalk.blue.bold(`🚀 Creating project: ${name}`));

        const generator = new ProjectGenerator();
        await generator.createProject(name, {
          startPort: options.port ? parseInt(options.port) : undefined,
          dbPort: options.databasePort
            ? parseInt(options.databasePort)
            : undefined,
        });

        console.log(
          chalk.green.bold(`✅ Project ${name} created successfully!`)
        );
      } catch (error) {
        console.error(chalk.red.bold("❌ Error creating project:"), error);
        process.exit(1);
      }
    }
  );

program
  .command("list")
  .description("List all generated projects")
  .action(() => {
    const generator = new ProjectGenerator();
    generator.listProjects();
  });

program
  .command("attach <name>")
  .description("Attach to an existing project's tmux session")
  .action(async (name: string) => {
    try {
      const generator = new ProjectGenerator();
      await generator.attachToProject(name);
    } catch (error) {
      console.error(chalk.red.bold("❌ Error attaching to project:"), error);
      process.exit(1);
    }
  });

program
  .command("kill <name>")
  .description("Kill a project's tmux session")
  .action(async (name: string) => {
    try {
      const generator = new ProjectGenerator();
      await generator.killProjectSession(name);
    } catch (error) {
      console.error(chalk.red.bold("❌ Error killing session:"), error);
      process.exit(1);
    }
  });

program
  .command("sessions")
  .description("List all active tmux sessions")
  .action(async () => {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const result = await execAsync("tmux list-sessions");
      console.log(chalk.blue.bold("📋 Active Tmux Sessions:"));
      console.log(result.stdout);
    } catch (error) {
      console.log(
        chalk.yellow("No active tmux sessions found or tmux is not available.")
      );
    }
  });

program.parse();
