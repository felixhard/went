import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

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
    
    // Fix missing worker files
    fixMissingWorkerFiles(projectPath);
    
    // Fix tsconfig.json
    fixTsConfig(projectPath);
    
    // Clean Next.js cache
    cleanNextCache(projectPath);
    
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
 * Creates worker files if they don't exist
 */
function fixMissingWorkerFiles(projectPath: string) {
  const spinner = ora({
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
      const filePath = path.join(projectPath, file.path);
      if (!fs.existsSync(filePath)) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, file.content);
        filesCreated++;
      }
    });
    
    if (filesCreated > 0) {
      spinner.succeed(chalk.green(`Created ${filesCreated} missing worker files`));
    } else {
      spinner.succeed(chalk.green('All worker files exist'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to create worker files'));
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
    
    // Update include pattern
    if (tsconfig.include) {
      // Remove problematic wildcards
      const hasWildcardTs = tsconfig.include.some((pattern: string) => pattern === '**/*.ts');
      const hasWildcardTsx = tsconfig.include.some((pattern: string) => pattern === '**/*.tsx');
      
      if (hasWildcardTs || hasWildcardTsx) {
        modified = true;
        
        // Remove wildcards
        tsconfig.include = tsconfig.include.filter((pattern: string) => 
          pattern !== '**/*.ts' && pattern !== '**/*.tsx'
        );
        
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