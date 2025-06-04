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
const execa_1 = require("execa");
function isValidProjectName(name) {
    if (!name.trim())
        return 'Project name cannot be empty.';
    if (!/^[a-zA-Z0-9_-]+$/.test(name))
        return 'Project name can only include letters, numbers, underscores, and hyphens.';
    return true;
}
function createPlaceholderFiles(projectPath) {
    const dirs = [
        'src/components/ui',
        'src/server/api/routers',
        'src/server/workers'
    ];
    dirs.forEach(dir => {
        const dirPath = path_1.default.join(projectPath, dir);
        const placeholderPath = path_1.default.join(dirPath, '.gitkeep');
        if (fs_extra_1.default.existsSync(dirPath) && fs_extra_1.default.readdirSync(dirPath).length === 0) {
            fs_extra_1.default.writeFileSync(placeholderPath, '');
        }
    });
    const workerFiles = [
        { path: 'src/server/workers/exampleWorker.ts', content: '// Example worker file\nexport default function exampleWorker() {\n  console.log("Example worker running");\n}\n' },
        { path: 'src/server/workers/anotherWorker.ts', content: '// Another worker file\nexport default function anotherWorker() {\n  console.log("Another worker running");\n}\n' }
    ];
    workerFiles.forEach(file => {
        const filePath = path_1.default.join(projectPath, file.path);
        if (!fs_extra_1.default.existsSync(filePath)) {
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(filePath));
            fs_extra_1.default.writeFileSync(filePath, file.content);
        }
    });
}
async function handleNewProjectCommand() {
    console.log(chalk_1.default.bold.blue('\nWent - Full-Stack Web Framework\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            validate: isValidProjectName,
        },
    ]);
    let projectName = answers.projectName.trim();
    const reservedNames = ["test", "tests", "example", "temp", "tmp"];
    if (reservedNames.includes(projectName.toLowerCase())) {
        const timestamp = Math.floor(Date.now() / 1000).toString().slice(-6);
        projectName = `${projectName}-${timestamp}`;
        console.log(chalk_1.default.yellow(`"${answers.projectName}" is reserved. Using "${projectName}".`));
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
        const filesToCopyAtRoot = [
            { template: 'package.json.template', target: 'package.json', needsProcessing: true },
            { template: 'tsconfig.json.template', target: 'tsconfig.json' },
            { template: 'next.config.mjs.template', target: 'next.config.mjs' },
            { template: 'next-env.d.ts.template', target: 'next-env.d.ts' },
            { template: 'tailwind.config.js.template', target: 'tailwind.config.js' },
            { template: 'postcss.config.js.template', target: 'postcss.config.js' },
            { template: 'components.json.template', target: 'components.json' },
            { template: 'went.config.ts.template', target: 'went.config.ts', needsProcessing: true },
            { template: 'prisma/schema.prisma.template', target: 'prisma/schema.prisma', isDirTarget: true },
            { template: '.env.example.template', target: '.env.example' },
            { template: '.env.example.template', target: '.env', specialHandling: 'copyEnv' },
            { template: 'README-AUTH.md.template', target: 'README-AUTH.md' },
            { template: 'README-DEPLOYMENT.md.template', target: 'README-DEPLOYMENT.md' },
            { template: '.gitignore.template', target: '.gitignore' }
        ];
        filesToCopyAtRoot.forEach(file => {
            const templatePath = path_1.default.join(templatesBasePath, file.template);
            const targetPath = path_1.default.join(projectPath, file.target);
            if (fs_extra_1.default.existsSync(templatePath)) {
                if (file.isDirTarget)
                    fs_extra_1.default.ensureDirSync(path_1.default.dirname(targetPath));
                if (file.needsProcessing) {
                    let content = fs_extra_1.default.readFileSync(templatePath, 'utf-8');
                    content = content.replace(/{{projectName}}/g, projectName);
                    fs_extra_1.default.writeFileSync(targetPath, content);
                }
                else if (file.specialHandling === 'copyEnv' && file.target === '.env') {
                    if (!fs_extra_1.default.existsSync(targetPath)) {
                        fs_extra_1.default.copyFileSync(templatePath, targetPath);
                    }
                }
                else {
                    fs_extra_1.default.copyFileSync(templatePath, targetPath);
                }
            }
        });
        // Directory structure
        const srcDirUserPath = path_1.default.join(projectPath, 'src');
        const appDirUserPath = path_1.default.join(srcDirUserPath, 'app');
        const componentsDirUserPath = path_1.default.join(srcDirUserPath, 'components');
        const componentsUiDirUserPath = path_1.default.join(componentsDirUserPath, 'ui');
        const libDirUserPath = path_1.default.join(srcDirUserPath, 'lib');
        const trpcClientDirUserPath = path_1.default.join(libDirUserPath, 'trpc');
        const serverDirUserPath = path_1.default.join(srcDirUserPath, 'server');
        const serverApiDirUserPath = path_1.default.join(serverDirUserPath, 'api');
        const serverApiRoutersUserPath = path_1.default.join(serverApiDirUserPath, 'routers');
        const serverLibDirUserPath = path_1.default.join(serverDirUserPath, 'lib');
        const serverJobsDirUserPath = path_1.default.join(serverDirUserPath, 'jobs');
        const serverWorkersDirUserPath = path_1.default.join(serverDirUserPath, 'workers');
        const appApiDirUserPath = path_1.default.join(appDirUserPath, 'api');
        const appApiTrpcDirUserPath = path_1.default.join(appApiDirUserPath, 'trpc');
        const appApiTrpcHandlerDirUserPath = path_1.default.join(appApiTrpcDirUserPath, '[trpc]');
        [
            appDirUserPath, componentsDirUserPath, componentsUiDirUserPath, libDirUserPath, trpcClientDirUserPath,
            serverDirUserPath, serverApiDirUserPath, serverApiRoutersUserPath, serverLibDirUserPath, serverJobsDirUserPath,
            serverWorkersDirUserPath, appApiDirUserPath, appApiTrpcDirUserPath, appApiTrpcHandlerDirUserPath
        ].forEach(d => fs_extra_1.default.ensureDirSync(d));
        const copyFilesWithBasePath = (filesArray, baseTargetDir) => {
            filesArray.forEach(file => {
                const templatePath = path_1.default.join(templatesBasePath, file.template);
                const targetPath = path_1.default.join(baseTargetDir, file.targetDir, file.targetFilename);
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(targetPath));
                if (fs_extra_1.default.existsSync(templatePath))
                    fs_extra_1.default.copyFileSync(templatePath, targetPath);
            });
        };
        // src/app
        copyFilesWithBasePath([
            { template: 'src/app/layout.tsx.template', targetDir: 'src/app', targetFilename: 'layout.tsx' },
            { template: 'src/app/page.tsx.template', targetDir: 'src/app', targetFilename: 'page.tsx' },
            { template: 'src/app/globals.css.template', targetDir: 'src/app', targetFilename: 'globals.css' }
        ], projectPath);
        // src/app/login, register, forgot-password, reset-password
        ['login', 'register', 'forgot-password', 'reset-password'].forEach(folder => {
            fs_extra_1.default.ensureDirSync(path_1.default.join(appDirUserPath, folder));
        });
        copyFilesWithBasePath([
            { template: 'src/app/login/page.tsx.template', targetDir: 'src/app/login', targetFilename: 'page.tsx' },
            { template: 'src/app/register/page.tsx.template', targetDir: 'src/app/register', targetFilename: 'page.tsx' },
            { template: 'src/app/forgot-password/page.tsx.template', targetDir: 'src/app/forgot-password', targetFilename: 'page.tsx' },
            { template: 'src/app/reset-password/page.tsx.template', targetDir: 'src/app/reset-password', targetFilename: 'page.tsx' }
        ], projectPath);
        // src/lib
        copyFilesWithBasePath([
            { template: 'src/lib/utils.ts.template', targetDir: 'src/lib', targetFilename: 'utils.ts' },
            { template: 'src/lib/trpc/client.ts.template', targetDir: 'src/lib/trpc', targetFilename: 'client.ts' },
            { template: 'src/lib/trpc/Provider.tsx.template', targetDir: 'src/lib/trpc', targetFilename: 'Provider.tsx' },
            { template: 'src/lib/auth.ts.template', targetDir: 'src/lib', targetFilename: 'auth.ts' },
            { template: 'src/lib/db.ts.template', targetDir: 'src/lib', targetFilename: 'db.ts' },
            { template: 'src/lib/auth-appearance.ts.template', targetDir: 'src/lib', targetFilename: 'auth-appearance.ts' },
            { template: 'src/lib/email.ts.template', targetDir: 'src/lib', targetFilename: 'email.ts' },
            { template: 'src/types/next-auth.d.ts.template', targetDir: 'src/types', targetFilename: 'next-auth.d.ts' }
        ], projectPath);
        // src/emails
        const emailsDirUserPath = path_1.default.join(srcDirUserPath, 'emails');
        fs_extra_1.default.ensureDirSync(emailsDirUserPath);
        copyFilesWithBasePath([
            { template: 'src/emails/WelcomeEmail.tsx.template', targetDir: 'src/emails', targetFilename: 'WelcomeEmail.tsx' },
            { template: 'src/emails/PasswordResetEmail.tsx.template', targetDir: 'src/emails', targetFilename: 'PasswordResetEmail.tsx' }
        ], projectPath);
        // src/server/api and related
        copyFilesWithBasePath([
            { template: 'src/server/api/trpc.ts.template', targetDir: 'src/server/api', targetFilename: 'trpc.ts' },
            { template: 'src/server/api/root.ts.template', targetDir: 'src/server/api', targetFilename: 'root.ts' },
            { template: 'src/server/api/routers/example.ts.template', targetDir: 'src/server/api/routers', targetFilename: 'example.ts' },
            { template: 'src/server/lib/pgBossInit.ts.template', targetDir: 'src/server/lib', targetFilename: 'pgBossInit.ts' },
            { template: 'src/server/jobs/index.ts.template', targetDir: 'src/server/jobs', targetFilename: 'index.ts' },
            { template: 'src/server/workers/exampleWorker.ts.template', targetDir: 'src/server/workers', targetFilename: 'exampleWorker.ts' },
            { template: 'src/server/workers/anotherWorker.ts.template', targetDir: 'src/server/workers', targetFilename: 'anotherWorker.ts' }
        ], projectPath);
        // src/components/auth
        const componentsAuthDirUserPath = path_1.default.join(componentsDirUserPath, 'auth');
        fs_extra_1.default.ensureDirSync(componentsAuthDirUserPath);
        copyFilesWithBasePath([
            { template: 'src/components/auth/auth-provider.tsx.template', targetDir: 'src/components/auth', targetFilename: 'auth-provider.tsx' },
            { template: 'src/components/auth/user-menu.tsx.template', targetDir: 'src/components/auth', targetFilename: 'user-menu.tsx' },
            { template: 'src/components/auth/auth-form.tsx.template', targetDir: 'src/components/auth', targetFilename: 'auth-form.tsx' },
            { template: 'src/components/auth/login-form.tsx.template', targetDir: 'src/components/auth', targetFilename: 'login-form.tsx' },
            { template: 'src/components/auth/register-form.tsx.template', targetDir: 'src/components/auth', targetFilename: 'register-form.tsx' },
            { template: 'src/components/client-only.tsx.template', targetDir: 'src/components', targetFilename: 'client-only.tsx' }
        ], projectPath);
        // src/components/ui
        copyFilesWithBasePath([
            { template: 'src/components/ui/button.tsx.template', targetDir: 'src/components/ui', targetFilename: 'button.tsx' },
            { template: 'src/components/ui/input.tsx.template', targetDir: 'src/components/ui', targetFilename: 'input.tsx' },
            { template: 'src/components/ui/textarea.tsx.template', targetDir: 'src/components/ui', targetFilename: 'textarea.tsx' },
            { template: 'src/components/ui/index.ts.template', targetDir: 'src/components/ui', targetFilename: 'index.ts' }
        ], projectPath);
        // src/app/api/auth
        const appApiAuthDirUserPath = path_1.default.join(appApiDirUserPath, 'auth');
        const appApiAuthNextAuthDirUserPath = path_1.default.join(appApiAuthDirUserPath, '[...nextauth]');
        const appApiAuthRegisterDirUserPath = path_1.default.join(appApiAuthDirUserPath, 'register');
        const appApiAuthResetPasswordDirUserPath = path_1.default.join(appApiAuthDirUserPath, 'reset-password');
        const appApiAuthRequestPasswordResetDirUserPath = path_1.default.join(appApiAuthDirUserPath, 'request-password-reset');
        [
            appApiAuthDirUserPath, appApiAuthNextAuthDirUserPath, appApiAuthRegisterDirUserPath,
            appApiAuthResetPasswordDirUserPath, appApiAuthRequestPasswordResetDirUserPath
        ].forEach(d => fs_extra_1.default.ensureDirSync(d));
        copyFilesWithBasePath([
            { template: 'src/app/api/auth/[...nextauth]/route.ts.template', targetDir: 'src/app/api/auth/[...nextauth]', targetFilename: 'route.ts' },
            { template: 'src/app/api/auth/register/route.ts.template', targetDir: 'src/app/api/auth/register', targetFilename: 'route.ts' },
            { template: 'src/app/api/auth/reset-password/route.ts.template', targetDir: 'src/app/api/auth/reset-password', targetFilename: 'route.ts' },
            { template: 'src/app/api/auth/request-password-reset/route.ts.template', targetDir: 'src/app/api/auth/request-password-reset', targetFilename: 'route.ts' }
        ], projectPath);
        // src/app/api/trpc/[trpc]
        const trpcApiRouteTemplatePath = path_1.default.join(templatesBasePath, 'trpcApiRoute.ts.template');
        const trpcApiRouteTargetPath = path_1.default.join(appApiTrpcHandlerDirUserPath, 'route.ts');
        if (fs_extra_1.default.existsSync(trpcApiRouteTemplatePath)) {
            fs_extra_1.default.copyFileSync(trpcApiRouteTemplatePath, trpcApiRouteTargetPath);
        }
        createPlaceholderFiles(projectPath);
        mainSpinner.succeed(`Project structure created`);
        // Dependencies install
        const depSpinner = (0, ora_1.default)({ text: 'Installing dependencies...', color: 'yellow' }).start();
        let dependenciesInstalledSuccessfully = false;
        try {
            (0, child_process_1.execSync)('npm install', { cwd: projectPath, stdio: 'ignore' });
            dependenciesInstalledSuccessfully = true;
            depSpinner.succeed('Dependencies installed');
        }
        catch (error) {
            depSpinner.fail('Failed to install dependencies. Run "npm install" manually.');
        }
        if (dependenciesInstalledSuccessfully) {
            // Tailwindcss-animate install if missing
            const packageJsonPath = path_1.default.join(projectPath, 'package.json');
            const packageJson = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, 'utf-8'));
            if (!packageJson.devDependencies['tailwindcss-animate']) {
                try {
                    (0, child_process_1.execSync)('npm install -D tailwindcss-animate@latest', { cwd: projectPath, stdio: 'ignore' });
                }
                catch { }
            }
            // Add shadcn/ui components with execa so user can interact if needed
            const componentsToAdd = ['button', 'card', 'input'];
            for (const component of componentsToAdd) {
                try {
                    await (0, execa_1.execa)('npx', [
                        'shadcn@latest',
                        'add',
                        component,
                        '--yes',
                        '--overwrite',
                        '--path', 'src/components/ui'
                    ], {
                        cwd: projectPath,
                        stdio: 'inherit'
                    });
                }
                catch { }
            }
        }
        // Final concise instructions
        console.log(chalk_1.default.bold.green(`\nProject "${projectName}" created.`));
        console.log('\nNext steps:');
        console.log(`  cd ${projectName}`);
        console.log('  npx prisma migrate dev --name init');
        console.log('  npm run dev');
        console.log('\nRead README-AUTH.md and README-JOBS.md for details.');
        console.log('\nHappy coding!');
    }
    catch (error) {
        mainSpinner.fail('Failed to create project');
        console.error('Error:', error);
        process.exit(1);
    }
}
