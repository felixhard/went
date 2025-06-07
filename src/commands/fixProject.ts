import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

// Constants for template placeholders (shared with newProject.ts)
const TEMPLATE_PLACEHOLDERS = {
    PROJECT_NAME: '{{projectName}}',
    AUTH_SECRET: 'PLACEHOLDER_WILL_BE_REPLACED'
} as const;

/**
 * Fixes common issues in a project
 */
export async function handleFixProjectCommand() {
  console.log(chalk.bold.blue('\n🔧 Fixing project issues\n'));
  
  const projectPath = process.cwd();
  console.log(chalk.dim(`Working in: ${projectPath}`));
  
  const mainSpinner = ora({
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
    
    mainSpinner.succeed(chalk.green('Project analysis complete'));
    console.log(chalk.bold.green('\n✅ Project fixes applied successfully!\n'));
  } catch (error) {
    mainSpinner.fail(chalk.red('Error fixing project'));
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

/**
 * Cleans TypeScript cache files
 */
function cleanTypeScriptCache(projectPath: string) {
  const spinner = ora({
    text: 'Cleaning TypeScript cache...',
    color: 'yellow',
  }).start();
  
  try {
    // Remove tsconfig.tsbuildinfo
    const tsBuildInfoPath = path.join(projectPath, 'tsconfig.tsbuildinfo');
    if (fs.existsSync(tsBuildInfoPath)) {
      fs.removeSync(tsBuildInfoPath);
    }
    
    // Remove .next/cache/typescript
    const tsNextCachePath = path.join(projectPath, '.next', 'cache', 'typescript');
    if (fs.existsSync(tsNextCachePath)) {
      fs.removeSync(tsNextCachePath);
    }
    
    spinner.succeed(chalk.green('TypeScript cache cleaned'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to clean TypeScript cache'));
    console.error(chalk.dim('This is non-critical, continuing...'));
  }
}

/**
 * Cleans Next.js cache
 */
function cleanNextCache(projectPath: string) {
  const spinner = ora({
    text: 'Cleaning Next.js cache...',
    color: 'magenta',
  }).start();
  
  try {
    // Check if package.json exists and has next dependency
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      spinner.info(chalk.blue('No package.json found, skipping Next.js cache cleaning'));
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
      spinner.info(chalk.blue('Next.js not found in dependencies, skipping cache cleaning'));
      return;
    }
    
    // Remove .next directory
    const nextCachePath = path.join(projectPath, '.next');
    if (fs.existsSync(nextCachePath)) {
      fs.removeSync(nextCachePath);
    }
    
    spinner.succeed(chalk.green('Next.js cache cleaned'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to clean Next.js cache'));
    console.error(chalk.dim('This is non-critical, continuing...'));
  }
}

/**
 * Checks for missing environment files and suggests fixes
 */
function checkEnvironmentFiles(projectPath: string) {
  const spinner = ora({
    text: 'Checking environment configuration...',
    color: 'cyan',
  }).start();
  
  try {
    const envPath = path.join(projectPath, '.env');
    const envExamplePath = path.join(projectPath, '.env.example');
    
    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        // Copy .env.example to .env if .env doesn't exist
        fs.copyFileSync(envExamplePath, envPath);
        spinner.succeed(chalk.green('Created .env file from .env.example'));
        console.log(chalk.yellow('  ⚠️  Remember to update your .env file with actual values'));
        console.log(chalk.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
      } else {
        spinner.warn(chalk.yellow('No .env file found'));
        console.log(chalk.dim('  💡 Create a .env file with your environment variables'));
        console.log(chalk.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
      }
    } else {
      // Check if .env file has AUTH_SECRET
      const envContent = fs.readFileSync(envPath, 'utf-8');
      if (!envContent.includes('AUTH_SECRET') || envContent.includes(TEMPLATE_PLACEHOLDERS.AUTH_SECRET)) {
        spinner.warn(chalk.yellow('AUTH_SECRET missing or not configured in .env'));
        console.log(chalk.dim('  💡 Generate AUTH_SECRET with: openssl rand -base64 32'));
        console.log(chalk.dim('  💡 Add it to your .env file: AUTH_SECRET="your_generated_secret"'));
      } else {
        spinner.succeed(chalk.green('Environment files are properly configured'));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to check environment files'));
    console.error(chalk.dim('This is non-critical, continuing...'));
  }
}

/**
 * Updates tsconfig.json to be more robust
 */
function fixTsConfig(projectPath: string) {
  const spinner = ora({
    text: 'Updating tsconfig.json...',
    color: 'green',
  }).start();
  
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    spinner.fail(chalk.red('tsconfig.json not found'));
    return;
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
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
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      spinner.succeed(chalk.green('Updated tsconfig.json with more robust settings'));
    } else {
      spinner.succeed(chalk.green('tsconfig.json already has optimal settings'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to update tsconfig.json'));
    console.error(chalk.dim('Error details:'), error);
  }
} 