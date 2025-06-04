"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrisma = generatePrisma;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const prismaSchemaBuilder_1 = require("./prismaSchemaBuilder");
const config_1 = require("../utils/config");
const files_1 = require("../utils/files");
/**
 * Command to generate Prisma schema based on went.config.ts settings
 */
async function generatePrisma() {
    console.log(chalk_1.default.bold.blue('\n🚀 Went Prisma Schema Generator\n'));
    const mainSpinner = (0, ora_1.default)({
        text: chalk_1.default.blue(`Reading configuration...`),
        color: 'blue',
    }).start();
    try {
        // Read went.config.ts for Prisma entity configurations
        const config = (0, config_1.readWentConfig)();
        mainSpinner.succeed(chalk_1.default.green('Configuration loaded successfully'));
        // Generate schema based on configuration
        const schemaSpinner = (0, ora_1.default)({
            text: 'Generating Prisma schema from configuration...',
            color: 'cyan',
        }).start();
        const prismaSchema = (0, prismaSchemaBuilder_1.generatePrismaSchema)(config);
        schemaSpinner.succeed(chalk_1.default.green('Prisma schema generated'));
        // Determine output directory & file path
        const outputDir = path_1.default.join(process.cwd(), 'prisma');
        const schemaFilePath = path_1.default.join(outputDir, 'schema.prisma');
        // Ensure the prisma directory exists
        const fileSpinner = (0, ora_1.default)({
            text: 'Writing schema to file...',
            color: 'yellow',
        }).start();
        (0, files_1.ensureDirectoryExists)(outputDir);
        // Write the generated schema
        fs_1.default.writeFileSync(schemaFilePath, prismaSchema);
        fileSpinner.succeed(chalk_1.default.green(`Schema file written to ${chalk_1.default.bold('prisma/schema.prisma')}`));
        // Success messages
        console.log(chalk_1.default.bold.green('\n✅ Prisma schema generated successfully!'));
        // Check if we're using the default User model
        if (!config.prisma || !config.prisma.entities || config.prisma.entities.length === 0) {
            console.log(chalk_1.default.yellow('\nℹ️  Using default authentication models'));
            console.log(chalk_1.default.dim('   Define custom entities in went.config.ts to extend the schema'));
        }
        // Provide next steps
        console.log(chalk_1.default.bold.blue('\n📋 Next steps:'));
        console.log(chalk_1.default.cyan('  1. Review the schema in prisma/schema.prisma'));
        console.log(chalk_1.default.cyan('  2. Setup your database connection in .env file'));
        console.log(chalk_1.default.cyan('  3. Run migrations with:'));
        console.log(chalk_1.default.gray('     went db migrate init'));
        console.log(chalk_1.default.cyan('  4. Start your development server:'));
        console.log(chalk_1.default.gray('     npm run dev'));
        console.log('');
    }
    catch (error) {
        mainSpinner.fail(chalk_1.default.red('Failed to generate schema'));
        console.error(chalk_1.default.red('❌ Error:'), error);
        process.exit(1);
    }
}
