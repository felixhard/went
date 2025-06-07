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
    const name = migrationName || 'init';
    console.log(chalk_1.default.bold.blue('\n🚀 Went Database Migration Tool\n'));
    try {
        // Check if prisma directory and schema exist
        const schemaPath = path_1.default.join(process.cwd(), 'prisma', 'schema.prisma');
        if (!fs_1.default.existsSync(schemaPath)) {
            console.log(chalk_1.default.red('\n❌ Error: Prisma schema not found'));
            console.log(chalk_1.default.yellow('Please ensure your project has a Prisma schema file'));
            process.exit(1);
        }
        // Check for .env file
        const envPath = path_1.default.join(process.cwd(), '.env');
        if (!fs_1.default.existsSync(envPath)) {
            console.log(chalk_1.default.yellow('\n⚠️ Warning: No .env file found'));
            console.log(chalk_1.default.gray('Make sure your database connection string is set correctly'));
        }
        // Check if this is the first migration
        const migrationsPath = path_1.default.join(process.cwd(), 'prisma', 'migrations');
        const isFirstMigration = !fs_1.default.existsSync(migrationsPath) || fs_1.default.readdirSync(migrationsPath).length === 0;
        if (isFirstMigration) {
            console.log(chalk_1.default.blue('🔍 First migration detected'));
            console.log(chalk_1.default.gray('This will create your database tables and migration history\n'));
        }
        else {
            console.log(chalk_1.default.blue('🔄 Applying schema changes'));
            console.log(chalk_1.default.gray('This will create a new migration for your schema changes\n'));
        }
        // Always use migrate dev for consistency
        console.log(chalk_1.default.blue(`📝 Creating migration: ${chalk_1.default.bold(name)}`));
        try {
            (0, child_process_1.execSync)(`npx prisma migrate dev --name ${name}`, {
                stdio: 'inherit'
            });
            if (isFirstMigration) {
                console.log(chalk_1.default.green('\n✅ Database initialized successfully!'));
                console.log(chalk_1.default.blue('📁 Migration files created in prisma/migrations/'));
                console.log(chalk_1.default.blue('🗄️  All tables created in your database'));
            }
            else {
                console.log(chalk_1.default.green('\n✅ Migration applied successfully!'));
                console.log(chalk_1.default.blue('📁 New migration file created'));
                console.log(chalk_1.default.blue('🗄️  Database schema updated'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('\n❌ Migration failed'));
            console.log(chalk_1.default.yellow('\nIf you see conflicts, you may need to:'));
            console.log(chalk_1.default.gray('  1. Review your schema changes'));
            console.log(chalk_1.default.gray('  2. Resolve any data conflicts manually'));
            console.log(chalk_1.default.gray('  3. Or run: npx prisma migrate reset (⚠️  will delete all data)'));
            process.exit(1);
        }
        // Generate Prisma client
        console.log(chalk_1.default.blue('\n🔄 Generating Prisma client...'));
        try {
            (0, child_process_1.execSync)('npx prisma generate', {
                stdio: 'inherit'
            });
            console.log(chalk_1.default.green('✅ Prisma client generated'));
        }
        catch (error) {
            console.log(chalk_1.default.yellow('⚠️ Warning: Failed to generate Prisma client'));
        }
        // Success message with context-aware next steps
        console.log(chalk_1.default.bold.blue('\n📋 Next steps:'));
        if (isFirstMigration) {
            console.log(chalk_1.default.cyan('  1. Your database is now set up with all tables'));
            console.log(chalk_1.default.cyan('  2. Migration history tracking is initialized'));
            console.log(chalk_1.default.cyan('  3. Prisma client is ready to use'));
            console.log(chalk_1.default.cyan('  4. Start your development server:'));
            console.log(chalk_1.default.gray('     npm run dev'));
            console.log(chalk_1.default.blue('\n💡 Future schema changes:'));
            console.log(chalk_1.default.gray('   Use "went db migrate [name]" to create new migrations'));
        }
        else {
            console.log(chalk_1.default.cyan('  1. Your database schema has been updated'));
            console.log(chalk_1.default.cyan('  2. New migration has been recorded'));
            console.log(chalk_1.default.cyan('  3. Prisma client has been regenerated'));
            console.log(chalk_1.default.cyan('  4. Continue development:'));
            console.log(chalk_1.default.gray('     npm run dev'));
        }
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error:'), error);
        process.exit(1);
    }
}
