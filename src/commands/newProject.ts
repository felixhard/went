import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

// Constants for template placeholders
const TEMPLATE_PLACEHOLDERS = {
    PROJECT_NAME: '{{projectName}}',
    AUTH_SECRET: 'PLACEHOLDER_WILL_BE_REPLACED'
} as const;

function isValidProjectName(name: string): boolean | string {
    if (!name.trim()) return 'Project name cannot be empty.';
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) return 'Project name can only include letters, numbers, underscores, and hyphens.';
    return true;
}

function generateAuthSecret(): string {
    try {
        // Try to use openssl to generate a secure random string
        const secret = execSync('openssl rand -base64 32', { encoding: 'utf-8' }).trim();
        return secret;
    } catch (error) {
        // Fallback to Node.js crypto if openssl is not available
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('base64');
    }
}

function processTemplateFile(filePath: string, projectName: string, authSecret?: string) {
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf-8');
            
            // Replace project name placeholder globally
            content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.PROJECT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), projectName);
            
            // Replace AUTH_SECRET placeholder if provided (globally)
            if (authSecret) {
                content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.AUTH_SECRET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), authSecret);
            }
            
            fs.writeFileSync(filePath, content);
        }
    } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to process template file ${filePath}:`), error);
    }
}

function copyAndProcessTemplate(templateDir: string, projectPath: string, projectName: string) {
    // Copy the entire template directory
    fs.copySync(templateDir, projectPath);
    
    // Generate AUTH_SECRET
    const authSecret = generateAuthSecret();
    
    // Find all .template files and rename them
    const findTemplateFiles = (dir: string) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                findTemplateFiles(fullPath);
            } else if (file.endsWith('.template')) {
                // Remove .template extension
                const newPath = fullPath.replace('.template', '');
                fs.moveSync(fullPath, newPath);
                
                // Process ALL template files for variable replacement
                processTemplateFile(newPath, projectName, authSecret);
                
                // Special handling for .env.example -> .env creation
                if (file === '.env.example.template') {
                    // Create .env file from .env.example
                    const envPath = path.join(path.dirname(newPath), '.env');
                    fs.copyFileSync(newPath, envPath);
                    // Process the .env file again to ensure AUTH_SECRET is replaced
                    processTemplateFile(envPath, projectName, authSecret);
                }
            }
        });
    };
    
    findTemplateFiles(projectPath);
    
    return authSecret;
}

export async function handleNewProjectCommand(providedProjectName?: string) {
    console.log(chalk.bold.blue('\nWent - Full-Stack Web Framework\n'));

    let projectName: string;
    
    if (providedProjectName) {
        // Use the provided project name and validate it
        const validation = isValidProjectName(providedProjectName);
        if (validation !== true) {
            console.error(chalk.red(`Invalid project name: ${validation}`));
            process.exit(1);
        }
        projectName = providedProjectName.trim();
    } else {
        // Prompt for project name if not provided
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'Project name:',
                validate: isValidProjectName,
            },
        ]);
        projectName = answers.projectName.trim();
    }

    const reservedNames = ["test", "tests", "example", "temp", "tmp"];
    if (reservedNames.includes(projectName.toLowerCase())) {
        const timestamp = Math.floor(Date.now() / 1000).toString().slice(-6);
        projectName = `${projectName}-${timestamp}`;
        console.log(chalk.yellow(`"${projectName.split('-')[0]}" is reserved. Using "${projectName}".`));
    }
    
    const projectPath = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        const filesInExistingDir = fs.readdirSync(projectPath);
        const nonHiddenFiles = filesInExistingDir.filter((file: string) => !file.startsWith('.'));
        if (nonHiddenFiles.length > 0) {
            console.error(chalk.red(`Directory "${projectName}" already exists and is not empty.`));
            process.exit(1);
        }
    } else {
        try { 
            fs.ensureDirSync(projectPath); 
        } catch (error) {
            console.error(chalk.red(`Error creating directory ${projectPath}:`), error);
            process.exit(1);
        }
    }

    const mainSpinner = ora({ text: `Creating project ${projectName}...`, color: 'blue' }).start();

    try {
        const templatesBasePath = path.resolve(__dirname, '../../templates/nextjs');
        
        if (!fs.existsSync(templatesBasePath)) {
            throw new Error(`Template directory not found: ${templatesBasePath}`);
        }

        // Copy and process the template
        const authSecret = copyAndProcessTemplate(templatesBasePath, projectPath, projectName);
        
        mainSpinner.succeed(`Project structure created`);

        // Dependencies install
        const depSpinner = ora({ text: 'Installing dependencies...', color: 'yellow' }).start();
        let dependenciesInstalledSuccessfully = false;
        
        try {
            // Stop the spinner to show npm progress
            depSpinner.stop();
            console.log(chalk.yellow('📦 Installing dependencies...\n'));
            
            execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
            dependenciesInstalledSuccessfully = true;
            
            console.log(chalk.green('\n✅ Dependencies installed successfully!'));
        } catch (error) {
            console.log(chalk.red('\n❌ Failed to install dependencies. Run "npm install" manually.'));
        }

        // Final instructions
        console.log(chalk.bold.green(`\nProject "${projectName}" created successfully! 🎉`));
        
        console.log('\n📋 ' + chalk.bold('Next steps:'));
        console.log(`  ${chalk.cyan(`cd ${projectName}`)}`);
        console.log(`  ${chalk.cyan('# Update your DATABASE_URL in the .env file')}`);
        console.log(`  ${chalk.cyan('went db migrate [migration-name]')} ${chalk.dim('# Set up database')}`);
        console.log(`  ${chalk.cyan('npm run dev')} ${chalk.dim('# Start development server')}`);
        
        console.log('\n💡 ' + chalk.bold('Important notes:'));
        console.log('  • Your .env file has been created with a secure AUTH_SECRET');
        console.log('  • Update the DATABASE_URL in .env with your actual database connection');
        console.log('  • The AUTH_SECRET is required for Auth.js to work properly');
        
        console.log('\nHappy coding! 🚀');

    } catch (error) {
        mainSpinner.fail('Failed to create project');
        console.error('Error:', error);
        process.exit(1);
    }
}
