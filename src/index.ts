#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generatePrisma } from './commands/generatePrisma';
import { handleNewProjectCommand } from './commands/newProject';
import { handleFixProjectCommand } from './commands/fixProject';
import { handleDbMigrate } from './commands/dbMigrate';

const program = new Command();

// Read version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

program
  .version(packageJson.version)
  .description('A CLI tool for generating Next.js projects with the "went" stack.');

// Main command - if first argument is not a known command, treat it as project name
program
  .argument('[project-name]', 'Name of the project to create')
  .action(async (projectName) => {
    // Always create a new project, prompt for name if not provided
    await handleNewProjectCommand(projectName);
  });

program
  .command('hello')
  .description('Prints a hello message.')
  .action(() => {
    console.log('Hello from went CLI!');
  });

// Command for generating Prisma schema
const prismaCommand = program.command('prisma');
prismaCommand
  .description('Prisma-related commands');

prismaCommand
  .command('generate')
  .alias('gen')
  .description('Generates a Prisma schema based on went.config.ts.')
  .option('-c, --config <path>', 'Path to the went.config.ts file')
  .action(async (options) => {
    await generatePrisma();
  });

// Command for database migrations
const dbCommand = program.command('db');
dbCommand
  .description('Database-related commands');

dbCommand
  .command('migrate [name]')
  .description('Run database migrations with optional migration name (default: "update").')
  .action(async (migrationName) => {
    await handleDbMigrate(migrationName);
  });

// Command for creating a new project (explicit command)
program
  .command('new [project-name]')
  .description('Creates a new Next.js project with the "went" stack.')
  .action(async (projectName) => {
    await handleNewProjectCommand(projectName);
  });

// Command for fixing common issues in existing projects
program
  .command('fix')
  .description('Fixes common issues in existing projects, like missing files or TypeScript errors.')
  .action(async () => {
    await handleFixProjectCommand();
  });

// Keep backward compatibility with colon-style commands
program
  .command('prisma:generate', { hidden: true })
  .action(async () => await generatePrisma());

program
  .command('db:migrate [name]', { hidden: true })
  .action(async (name) => await handleDbMigrate(name));

program.parse(process.argv);