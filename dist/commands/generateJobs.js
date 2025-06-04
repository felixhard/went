"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenerateJobsCommand = handleGenerateJobsCommand;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function handleGenerateJobsCommand() {
    console.log('Generating jobs types and APIs...');
    // Make sure we're in a went project
    const cwd = process.cwd();
    const packageJsonPath = path_1.default.join(cwd, 'package.json');
    if (!fs_extra_1.default.existsSync(packageJsonPath)) {
        console.error('Error: package.json not found. Make sure you are in a went project directory.');
        process.exit(1);
    }
    // Read jobs.went.json
    const jobsConfigPath = path_1.default.join(cwd, 'jobs.went.json');
    if (!fs_extra_1.default.existsSync(jobsConfigPath)) {
        console.error('Error: jobs.went.json not found. Create one to define your jobs.');
        console.log('You can use jobs.went.json.example as a starting point if it exists.');
        process.exit(1);
    }
    try {
        const jobsConfigContent = fs_extra_1.default.readFileSync(jobsConfigPath, 'utf-8');
        const jobsConfig = JSON.parse(jobsConfigContent);
        // Validate jobs config
        const jobDefinitions = {};
        for (const jobName in jobsConfig) {
            const job = jobsConfig[jobName];
            // Basic validation
            if (!job.executor) {
                console.error(`Error: Job "${jobName}" is missing required "executor" field.`);
                process.exit(1);
            }
            if (!job.perform || !job.perform.fn) {
                console.error(`Error: Job "${jobName}" is missing required "perform.fn" field.`);
                process.exit(1);
            }
            // Currently only support PgBoss
            if (job.executor !== 'PgBoss') {
                console.error(`Error: Job "${jobName}" has unsupported executor "${job.executor}". Currently only "PgBoss" is supported.`);
                process.exit(1);
            }
            // Add to validated definitions
            jobDefinitions[jobName] = {
                name: jobName,
                executor: job.executor,
                perform: {
                    fn: job.perform.fn,
                    executorOptions: job.perform.executorOptions
                },
                schedule: job.schedule,
                entities: job.entities || []
            };
            // Check if worker file exists
            const workerPath = job.perform.fn.replace('@server', path_1.default.join(cwd, 'src', 'server'));
            if (!fs_extra_1.default.existsSync(workerPath) && !fs_extra_1.default.existsSync(workerPath + '.ts') && !fs_extra_1.default.existsSync(workerPath + '.js')) {
                console.warn(`Warning: Worker file not found for job "${jobName}" at "${workerPath}". Make sure it exists.`);
            }
        }
        // Create .went directory if it doesn't exist
        const wentDir = path_1.default.join(cwd, '.went');
        const generatedDir = path_1.default.join(wentDir, 'generated');
        fs_extra_1.default.ensureDirSync(generatedDir);
        // Generate the jobs.ts file
        const jobsTypeFilePath = path_1.default.join(generatedDir, 'jobs.ts');
        const jobsTypeFileContent = generateJobsTypeFile(jobDefinitions);
        fs_extra_1.default.writeFileSync(jobsTypeFilePath, jobsTypeFileContent);
        console.log(`✅ Generated jobs types and APIs at .went/generated/jobs.ts`);
        console.log(`You can now import them in your code. For example:`);
        console.log(`import { exampleJob } from '~/.went/generated/jobs';`);
        console.log(`await exampleJob.submit({ /* args */ });`);
    }
    catch (error) {
        console.error('Error generating jobs types and APIs:', error);
        process.exit(1);
    }
}
function generateJobsTypeFile(jobDefinitions) {
    const imports = [
        'import { PrismaClient } from \'@prisma/client\';',
        'import type { Job as PgBossJob, SendOptions as PgBossSendOptions } from \'pg-boss\';',
        'import { getPgBoss } from \'@/server/lib/pgBossInit\';'
    ];
    // Collect all unique entity names
    const allEntities = new Set();
    Object.values(jobDefinitions).forEach(job => {
        (job.entities || []).forEach(entity => allEntities.add(entity));
    });
    // Add entity imports if there are any
    if (allEntities.size > 0) {
        imports.push(`import type { ${Array.from(allEntities).join(', ')} } from '@prisma/client';`);
    }
    // Base context type
    const baseContextType = `
// Base context available to all jobs
type BaseJobContext = { prisma: PrismaClient };
`;
    // Generate types for each job
    const jobTypes = Object.values(jobDefinitions).map(job => {
        const pascalCaseName = job.name.charAt(0).toUpperCase() + job.name.slice(1);
        const entitiesType = job.entities && job.entities.length > 0
            ? `
export type ${pascalCaseName}Entities = {
  ${job.entities.map(entity => `${entity}: PrismaClient['${entity.toLowerCase()}']`).join(';\n  ')};
};`
            : '';
        return `
// Types for ${job.name}
export type ${pascalCaseName}Input = any; // Define specific input type if needed
export type ${pascalCaseName}Output = any; // Define specific output type if needed${entitiesType}
export type ${pascalCaseName}Context = BaseJobContext${job.entities && job.entities.length > 0 ? ` & { entities: ${pascalCaseName}Entities }` : ''};
export type ${pascalCaseName}PerformFn = (args: ${pascalCaseName}Input, context: ${pascalCaseName}Context) => Promise<${pascalCaseName}Output>;

// API for ${job.name}
export const ${job.name} = {
  submit: async (
    args: ${pascalCaseName}Input,
    options?: PgBossSendOptions
  ): Promise<{ jobId: string | null }> => {
    const boss = await getPgBoss();
    const id = await boss.send('${job.name}', args, options);
    return { jobId: id };
  },
  delay: (startAfter: number | string | Date) => {
    return {
      submit: async (
        args: ${pascalCaseName}Input,
        options?: Omit<PgBossSendOptions, 'startAfter'>
      ): Promise<{ jobId: string | null }> => {
        const boss = await getPgBoss();
        const id = await boss.send('${job.name}', args, { ...options, startAfter });
        return { jobId: id };
      }
    };
  }
};`;
    }).join('\n');
    // Combine everything
    return `${imports.join('\n')}\n${baseContextType}\n${jobTypes}\n`;
}
