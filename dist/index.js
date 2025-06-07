#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const generatePrisma_1 = require("./commands/generatePrisma");
const newProject_1 = require("./commands/newProject");
const fixProject_1 = require("./commands/fixProject");
const dbMigrate_1 = require("./commands/dbMigrate");
const program = new commander_1.Command();
// Read version from package.json
const packageJsonPath = (0, path_1.join)(__dirname, '..', 'package.json');
const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf8'));
program
    .version(packageJson.version)
    .description('A CLI tool for generating Next.js projects with the "went" stack.');
// Main command - if first argument is not a known command, treat it as project name
program
    .argument('[project-name]', 'Name of the project to create')
    .action(async (projectName) => {
    // Always create a new project, prompt for name if not provided
    await (0, newProject_1.handleNewProjectCommand)(projectName);
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
    await (0, generatePrisma_1.generatePrisma)();
});
// Command for database migrations
const dbCommand = program.command('db');
dbCommand
    .description('Database-related commands');
dbCommand
    .command('migrate [name]')
    .description('Run database migrations with optional migration name (default: "update").')
    .action(async (migrationName) => {
    await (0, dbMigrate_1.handleDbMigrate)(migrationName);
});
// Command for creating a new project (explicit command)
program
    .command('new [project-name]')
    .description('Creates a new Next.js project with the "went" stack.')
    .action(async (projectName) => {
    await (0, newProject_1.handleNewProjectCommand)(projectName);
});
// Command for fixing common issues in existing projects
program
    .command('fix')
    .description('Fixes common issues in existing projects, like missing files or TypeScript errors.')
    .action(async () => {
    await (0, fixProject_1.handleFixProjectCommand)();
});
// Keep backward compatibility with colon-style commands
program
    .command('prisma:generate', { hidden: true })
    .action(async () => await (0, generatePrisma_1.generatePrisma)());
program
    .command('db:migrate [name]', { hidden: true })
    .action(async (name) => await (0, dbMigrate_1.handleDbMigrate)(name));
program.parse(process.argv);
