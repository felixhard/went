#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generatePrisma_1 = require("./commands/generatePrisma");
const newProject_1 = require("./commands/newProject");
const generateJobs_1 = require("./commands/generateJobs");
const fixProject_1 = require("./commands/fixProject");
const dbMigrate_1 = require("./commands/dbMigrate");
const program = new commander_1.Command();
program
    .version('0.0.1') // Consider reading from package.json later
    .description('A CLI tool for generating Next.js projects with the "went" stack.');
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
// Command for creating a new project
program
    .command('new')
    .description('Creates a new Next.js project with the "went" stack.')
    .action(async () => {
    await (0, newProject_1.handleNewProjectCommand)();
});
// Command for generating jobs types and APIs
const jobsCommand = program.command('jobs');
jobsCommand
    .description('Jobs-related commands');
jobsCommand
    .command('generate')
    .alias('gen')
    .description('Generates TypeScript types and APIs for jobs defined in jobs.went.json.')
    .action(async () => {
    await (0, generateJobs_1.handleGenerateJobsCommand)();
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
    .command('jobs:generate', { hidden: true })
    .action(async () => await (0, generateJobs_1.handleGenerateJobsCommand)());
program
    .command('db:migrate [name]', { hidden: true })
    .action(async (name) => await (0, dbMigrate_1.handleDbMigrate)(name));
program.parse(process.argv);
// Output help if no command is specified
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
