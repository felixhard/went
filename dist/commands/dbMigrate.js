"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDbMigrate = handleDbMigrate;
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Command to run Prisma migrations with improved output and handling
 * @param migrationName Optional name for the migration
 */
async function handleDbMigrate(migrationName) {
    // Default migration name if not provided
    const name = migrationName || 'update';
    console.log(chalk_1.default.bold.blue('\n🚀 Went Database Migration Tool\n'));
    try {
        // Check if prisma directory and schema exist
        const schemaPath = path_1.default.join(process.cwd(), 'prisma', 'schema.prisma');
        if (!fs_1.default.existsSync(schemaPath)) {
            console.log(chalk_1.default.red('\n❌ Error: Prisma schema not found'));
            console.log(chalk_1.default.yellow('Please run `went prisma generate` first to create your Prisma schema'));
            process.exit(1);
        }
        // Check for .env file
        const envPath = path_1.default.join(process.cwd(), '.env');
        if (!fs_1.default.existsSync(envPath)) {
            console.log(chalk_1.default.yellow('\n⚠️ Warning: No .env file found'));
            console.log(chalk_1.default.gray('Make sure your database connection string is set correctly'));
        }
        console.log(chalk_1.default.blue(`Running database migration: ${chalk_1.default.bold(name)}`));
        try {
            // Run the migration using the latest Prisma CLI
            (0, child_process_1.execSync)(`npx prisma migrate dev --name ${name}`, {
                stdio: 'inherit' // This preserves terminal interactivity
            });
            console.log(chalk_1.default.green('\n✅ Migration completed successfully'));
            // Success message
            console.log(chalk_1.default.bold.blue('\n📋 Next steps:'));
            console.log(chalk_1.default.cyan('  1. Your database is now updated with the latest schema'));
            console.log(chalk_1.default.cyan('  2. Prisma client has been automatically generated'));
            console.log(chalk_1.default.cyan('  3. Start your development server:'));
            console.log(chalk_1.default.gray('     npm run dev'));
            console.log('');
        }
        catch (error) {
            // The error will already be displayed to the user because of stdio: 'inherit'
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error:'), error);
        process.exit(1);
    }
}
