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
// Constants for template placeholders (shared with newProject.ts)
const TEMPLATE_PLACEHOLDERS = {
    PROJECT_NAME: '{{projectName}}',
    AUTH_SECRET: 'PLACEHOLDER_WILL_BE_REPLACED'
};
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
        // Fix tsconfig.json
        fixTsConfig(projectPath);
        // Clean Next.js cache
        cleanNextCache(projectPath);
        // Check for missing environment files
        checkEnvironmentFiles(projectPath);
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
 * Checks for missing environment files and suggests fixes
 */
function checkEnvironmentFiles(projectPath) {
    const spinner = (0, ora_1.default)({
        text: 'Checking environment configuration...',
        color: 'cyan',
    }).start();
    try {
        const envPath = path_1.default.join(projectPath, '.env');
        const envExamplePath = path_1.default.join(projectPath, '.env.example');
        if (!fs_extra_1.default.existsSync(envPath)) {
            if (fs_extra_1.default.existsSync(envExamplePath)) {
                // Copy .env.example to .env if .env doesn't exist
                fs_extra_1.default.copyFileSync(envExamplePath, envPath);
                spinner.succeed(chalk_1.default.green('Created .env file from .env.example'));
                console.log(chalk_1.default.yellow('  ⚠️  Remember to update your .env file with actual values'));
                console.log(chalk_1.default.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
            }
            else {
                spinner.warn(chalk_1.default.yellow('No .env file found'));
                console.log(chalk_1.default.dim('  💡 Create a .env file with your environment variables'));
                console.log(chalk_1.default.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
            }
        }
        else {
            // Check if .env file has AUTH_SECRET
            const envContent = fs_extra_1.default.readFileSync(envPath, 'utf-8');
            if (!envContent.includes('AUTH_SECRET') || envContent.includes(TEMPLATE_PLACEHOLDERS.AUTH_SECRET)) {
                spinner.warn(chalk_1.default.yellow('AUTH_SECRET missing or not configured in .env'));
                console.log(chalk_1.default.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
                console.log(chalk_1.default.dim('  💡 Add it to your .env file: AUTH_SECRET="your_generated_secret"'));
            }
            else {
                spinner.succeed(chalk_1.default.green('Environment files are properly configured'));
            }
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to check environment files'));
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
