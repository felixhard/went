"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewProjectCommand = handleNewProjectCommand;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
// Constants for template placeholders
const TEMPLATE_PLACEHOLDERS = {
    PROJECT_NAME: '{{projectName}}',
    AUTH_SECRET: 'PLACEHOLDER_WILL_BE_REPLACED'
};
function isValidProjectName(name) {
    if (!name.trim())
        return 'Project name cannot be empty.';
    if (!/^[a-zA-Z0-9_-]+$/.test(name))
        return 'Project name can only include letters, numbers, underscores, and hyphens.';
    return true;
}
function generateAuthSecret() {
    try {
        // Try to use openssl to generate a secure random string
        const secret = (0, child_process_1.execSync)('openssl rand -base64 32', { encoding: 'utf-8' }).trim();
        return secret;
    }
    catch (error) {
        // Fallback to Node.js crypto if openssl is not available
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('base64');
    }
}
function processTemplateFile(filePath, projectName, authSecret) {
    try {
        if (fs_extra_1.default.existsSync(filePath)) {
            let content = fs_extra_1.default.readFileSync(filePath, 'utf-8');
            // Replace project name placeholder globally
            content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.PROJECT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), projectName);
            // Replace AUTH_SECRET placeholder if provided (globally)
            if (authSecret) {
                content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.AUTH_SECRET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), authSecret);
            }
            fs_extra_1.default.writeFileSync(filePath, content);
        }
    }
    catch (error) {
        console.warn(chalk_1.default.yellow(`Warning: Failed to process template file ${filePath}:`), error);
    }
}
function copyAndProcessTemplate(templateDir, projectPath, projectName) {
    // Copy the entire template directory
    fs_extra_1.default.copySync(templateDir, projectPath);
    // Generate AUTH_SECRET
    const authSecret = generateAuthSecret();
    // Find all .template files and rename them
    const findTemplateFiles = (dir) => {
        const files = fs_extra_1.default.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path_1.default.join(dir, file);
            const stat = fs_extra_1.default.statSync(fullPath);
            if (stat.isDirectory()) {
                findTemplateFiles(fullPath);
            }
            else if (file.endsWith('.template')) {
                // Remove .template extension
                const newPath = fullPath.replace('.template', '');
                fs_extra_1.default.moveSync(fullPath, newPath);
                // Process ALL template files for variable replacement
                processTemplateFile(newPath, projectName, authSecret);
                // Special handling for .env.example -> .env creation
                if (file === '.env.example.template') {
                    // Create .env file from .env.example
                    const envPath = path_1.default.join(path_1.default.dirname(newPath), '.env');
                    fs_extra_1.default.copyFileSync(newPath, envPath);
                    // Process the .env file again to ensure AUTH_SECRET is replaced
                    processTemplateFile(envPath, projectName, authSecret);
                }
            }
        });
    };
    findTemplateFiles(projectPath);
    return authSecret;
}
async function handleNewProjectCommand(providedProjectName) {
    console.log(chalk_1.default.bold.blue('\nWent - Full-Stack Web Framework\n'));
    let projectName;
    if (providedProjectName) {
        // Use the provided project name and validate it
        const validation = isValidProjectName(providedProjectName);
        if (validation !== true) {
            console.error(chalk_1.default.red(`Invalid project name: ${validation}`));
            process.exit(1);
        }
        projectName = providedProjectName.trim();
    }
    else {
        // Prompt for project name if not provided
        const answers = await inquirer_1.default.prompt([
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
        console.log(chalk_1.default.yellow(`"${projectName.split('-')[0]}" is reserved. Using "${projectName}".`));
    }
    const projectPath = path_1.default.resolve(process.cwd(), projectName);
    if (fs_extra_1.default.existsSync(projectPath)) {
        const filesInExistingDir = fs_extra_1.default.readdirSync(projectPath);
        const nonHiddenFiles = filesInExistingDir.filter((file) => !file.startsWith('.'));
        if (nonHiddenFiles.length > 0) {
            console.error(chalk_1.default.red(`Directory "${projectName}" already exists and is not empty.`));
            process.exit(1);
        }
    }
    else {
        try {
            fs_extra_1.default.ensureDirSync(projectPath);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error creating directory ${projectPath}:`), error);
            process.exit(1);
        }
    }
    const mainSpinner = (0, ora_1.default)({ text: `Creating project ${projectName}...`, color: 'blue' }).start();
    try {
        const templatesBasePath = path_1.default.resolve(__dirname, '../../templates/nextjs');
        if (!fs_extra_1.default.existsSync(templatesBasePath)) {
            throw new Error(`Template directory not found: ${templatesBasePath}`);
        }
        // Copy and process the template
        const authSecret = copyAndProcessTemplate(templatesBasePath, projectPath, projectName);
        mainSpinner.succeed(`Project structure created`);
        // Dependencies install
        const depSpinner = (0, ora_1.default)({ text: 'Installing dependencies...', color: 'yellow' }).start();
        let dependenciesInstalledSuccessfully = false;
        try {
            // Stop the spinner to show npm progress
            depSpinner.stop();
            console.log(chalk_1.default.yellow('📦 Installing dependencies...\n'));
            (0, child_process_1.execSync)('npm install', { cwd: projectPath, stdio: 'inherit' });
            dependenciesInstalledSuccessfully = true;
            console.log(chalk_1.default.green('\n✅ Dependencies installed successfully!'));
        }
        catch (error) {
            console.log(chalk_1.default.red('\n❌ Failed to install dependencies. Run "npm install" manually.'));
        }
        // Final instructions
        console.log(chalk_1.default.bold.green(`\nProject "${projectName}" created successfully! 🎉`));
        console.log('\n📋 ' + chalk_1.default.bold('Next steps:'));
        console.log(`  ${chalk_1.default.cyan(`cd ${projectName}`)}`);
        console.log(`  ${chalk_1.default.cyan('# Update your DATABASE_URL in the .env file')}`);
        console.log(`  ${chalk_1.default.cyan('went db migrate [migration-name]')} ${chalk_1.default.dim('# Set up database')}`);
        console.log(`  ${chalk_1.default.cyan('npm run dev')} ${chalk_1.default.dim('# Start development server')}`);
        console.log('\n💡 ' + chalk_1.default.bold('Important notes:'));
        console.log('  • Your .env file has been created with a secure AUTH_SECRET');
        console.log('  • Update the DATABASE_URL in .env with your actual database connection');
        console.log('  • The AUTH_SECRET is required for Auth.js to work properly');
        console.log('\nHappy coding! 🚀');
    }
    catch (error) {
        mainSpinner.fail('Failed to create project');
        console.error('Error:', error);
        process.exit(1);
    }
}
