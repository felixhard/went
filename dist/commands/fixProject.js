"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFixProjectCommand = handleFixProjectCommand;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
/**
 * Fixes common issues in a project
 */
async function handleFixProjectCommand() {
    console.log(chalk_1.default.bold.blue('\n🔧 Fixing project issues\n'));
    const projectPath = process.cwd();
    console.log(chalk_1.default.dim(`Working in: ${projectPath}`));
    const mainSpinner = (0, ora_1.default)({
        text: 'Analyzing project...',
        color: 'blue',
    }).start();
    try {
        // Clean TypeScript cache
        cleanTypeScriptCache(projectPath);
        // Fix missing worker files
        fixMissingWorkerFiles(projectPath);
        // Fix tsconfig.json
        fixTsConfig(projectPath);
        // Clean Next.js cache
        cleanNextCache(projectPath);
        mainSpinner.succeed(chalk_1.default.green('Project analysis complete'));
        console.log(chalk_1.default.bold.green('\n✅ Project fixes applied successfully!\n'));
    }
    catch (error) {
        mainSpinner.fail(chalk_1.default.red('Error fixing project'));
        console.error(chalk_1.default.red('Error:'), error);
        process.exit(1);
    }
}
/**
 * Cleans TypeScript cache files
 */
function cleanTypeScriptCache(projectPath) {
    const spinner = (0, ora_1.default)({
        text: 'Cleaning TypeScript cache...',
        color: 'yellow',
    }).start();
    try {
        // Remove tsconfig.tsbuildinfo
        const tsBuildInfoPath = path_1.default.join(projectPath, 'tsconfig.tsbuildinfo');
        if (fs_extra_1.default.existsSync(tsBuildInfoPath)) {
            fs_extra_1.default.removeSync(tsBuildInfoPath);
        }
        // Remove .next/cache/typescript
        const tsNextCachePath = path_1.default.join(projectPath, '.next', 'cache', 'typescript');
        if (fs_extra_1.default.existsSync(tsNextCachePath)) {
            fs_extra_1.default.removeSync(tsNextCachePath);
        }
        spinner.succeed(chalk_1.default.green('TypeScript cache cleaned'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to clean TypeScript cache'));
        console.error(chalk_1.default.dim('This is non-critical, continuing...'));
    }
}
/**
 * Cleans Next.js cache
 */
function cleanNextCache(projectPath) {
    const spinner = (0, ora_1.default)({
        text: 'Cleaning Next.js cache...',
        color: 'magenta',
    }).start();
    try {
        // Check if package.json exists and has next dependency
        const packageJsonPath = path_1.default.join(projectPath, 'package.json');
        if (!fs_extra_1.default.existsSync(packageJsonPath)) {
            spinner.info(chalk_1.default.blue('No package.json found, skipping Next.js cache cleaning'));
            return;
        }
        const packageJson = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, 'utf-8'));
        if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
            spinner.info(chalk_1.default.blue('Next.js not found in dependencies, skipping cache cleaning'));
            return;
        }
        // Remove .next directory
        const nextCachePath = path_1.default.join(projectPath, '.next');
        if (fs_extra_1.default.existsSync(nextCachePath)) {
            fs_extra_1.default.removeSync(nextCachePath);
        }
        spinner.succeed(chalk_1.default.green('Next.js cache cleaned'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to clean Next.js cache'));
        console.error(chalk_1.default.dim('This is non-critical, continuing...'));
    }
}
/**
 * Creates worker files if they don't exist
 */
function fixMissingWorkerFiles(projectPath) {
    const spinner = (0, ora_1.default)({
        text: 'Checking for missing worker files...',
        color: 'cyan',
    }).start();
    const workerFiles = [
        {
            path: 'src/server/workers/exampleWorker.ts',
            content: '// Example worker file\nexport default function exampleWorker() {\n  console.log("Example worker running");\n}\n'
        },
        {
            path: 'src/server/workers/anotherWorker.ts',
            content: '// Another worker file\nexport default function anotherWorker() {\n  console.log("Another worker running");\n}\n'
        }
    ];
    let filesCreated = 0;
    try {
        workerFiles.forEach(file => {
            const filePath = path_1.default.join(projectPath, file.path);
            if (!fs_extra_1.default.existsSync(filePath)) {
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(filePath));
                fs_extra_1.default.writeFileSync(filePath, file.content);
                filesCreated++;
            }
        });
        if (filesCreated > 0) {
            spinner.succeed(chalk_1.default.green(`Created ${filesCreated} missing worker files`));
        }
        else {
            spinner.succeed(chalk_1.default.green('All worker files exist'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create worker files'));
        console.error(chalk_1.default.dim('This is non-critical, continuing...'));
    }
}
/**
 * Updates tsconfig.json to be more robust
 */
function fixTsConfig(projectPath) {
    const spinner = (0, ora_1.default)({
        text: 'Updating tsconfig.json...',
        color: 'green',
    }).start();
    const tsconfigPath = path_1.default.join(projectPath, 'tsconfig.json');
    if (!fs_extra_1.default.existsSync(tsconfigPath)) {
        spinner.fail(chalk_1.default.red('tsconfig.json not found'));
        return;
    }
    try {
        const tsconfig = JSON.parse(fs_extra_1.default.readFileSync(tsconfigPath, 'utf-8'));
        let modified = false;
        // Update include pattern
        if (tsconfig.include) {
            // Remove problematic wildcards
            const hasWildcardTs = tsconfig.include.some((pattern) => pattern === '**/*.ts');
            const hasWildcardTsx = tsconfig.include.some((pattern) => pattern === '**/*.tsx');
            if (hasWildcardTs || hasWildcardTsx) {
                modified = true;
                // Remove wildcards
                tsconfig.include = tsconfig.include.filter((pattern) => pattern !== '**/*.ts' && pattern !== '**/*.tsx');
                // Add specific directories
                const specificDirs = [
                    "src/app/**/*.{ts,tsx}",
                    "src/components/**/*.{ts,tsx}",
                    "src/lib/**/*.{ts,tsx}",
                    "src/types/**/*.{ts,tsx}",
                    "src/server/api/**/*.{ts,tsx}",
                    "src/server/lib/**/*.{ts,tsx}",
                    "src/server/jobs/**/*.{ts,tsx}"
                ];
                specificDirs.forEach(dir => {
                    if (!tsconfig.include.includes(dir)) {
                        tsconfig.include.push(dir);
                    }
                });
            }
        }
        // Update exclude pattern
        if (!tsconfig.exclude) {
            tsconfig.exclude = [];
            modified = true;
        }
        // Ensure node_modules is excluded
        if (!tsconfig.exclude.includes('node_modules')) {
            tsconfig.exclude.push('node_modules');
            modified = true;
        }
        // Add test files to exclude
        const testExcludes = [
            '**/*.spec.ts',
            '**/*.test.ts',
            '**/*.spec.tsx',
            '**/*.test.tsx'
        ];
        testExcludes.forEach(pattern => {
            if (!tsconfig.exclude.includes(pattern)) {
                tsconfig.exclude.push(pattern);
                modified = true;
            }
        });
        // Exclude workers directory
        if (!tsconfig.exclude.includes('src/server/workers/**/*.ts')) {
            tsconfig.exclude.push('src/server/workers/**/*.ts');
            modified = true;
        }
        // Add helpful compiler options
        if (!tsconfig.compilerOptions) {
            tsconfig.compilerOptions = {};
            modified = true;
        }
        if (!tsconfig.compilerOptions.forceConsistentCasingInFileNames) {
            tsconfig.compilerOptions.forceConsistentCasingInFileNames = true;
            modified = true;
        }
        if (tsconfig.compilerOptions.noErrorTruncation === undefined) {
            tsconfig.compilerOptions.noErrorTruncation = false;
            modified = true;
        }
        // Write updated config if modified
        if (modified) {
            fs_extra_1.default.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
            spinner.succeed(chalk_1.default.green('Updated tsconfig.json with more robust settings'));
        }
        else {
            spinner.succeed(chalk_1.default.green('tsconfig.json already has optimal settings'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to update tsconfig.json'));
        console.error(chalk_1.default.dim('Error details:'), error);
    }
}
