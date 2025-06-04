#!/usr/bin/env node

import { Command } from 'commander';
import { generatePrisma } from './commands/generatePrisma';
import { handleNewProjectCommand } from './commands/newProject';
import { handleGenerateJobsCommand } from './commands/generateJobs';
import { handleFixProjectCommand } from './commands/fixProject';
import { handleDbMigrate } from './commands/dbMigrate';

const program = new Command();

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

// Command for creating a new project
program
  .command('new')
  .description('Creates a new Next.js project with the "went" stack.')
  .action(async () => {
    await handleNewProjectCommand();
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
    await handleGenerateJobsCommand();
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
  .command('jobs:generate', { hidden: true })
  .action(async () => await handleGenerateJobsCommand());

program
  .command('db:migrate [name]', { hidden: true })
  .action(async (name) => await handleDbMigrate(name));

program.parse(process.argv);

// Output help if no command is specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}