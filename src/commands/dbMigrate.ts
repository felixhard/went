import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

/**
 * Command to run Prisma migrations with improved output and handling
 * @param migrationName Optional name for the migration
 */
export async function handleDbMigrate(migrationName?: string) {
  // Default migration name if not provided
  const name = migrationName || 'update';
  
  console.log(chalk.bold.blue('\n🚀 Went Database Migration Tool\n'));
  
  try {
    // Check if prisma directory and schema exist
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.log(chalk.red('\n❌ Error: Prisma schema not found'));
      console.log(chalk.yellow('Please run `went prisma generate` first to create your Prisma schema'));
      process.exit(1);
    }
    
    // Check for .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log(chalk.yellow('\n⚠️ Warning: No .env file found'));
      console.log(chalk.gray('Make sure your database connection string is set correctly'));
    }
    
    console.log(chalk.blue(`Running database migration: ${chalk.bold(name)}`));
    
    try {
      // Run the migration using the latest Prisma CLI
      execSync(`npx prisma migrate dev --name ${name}`, {
        stdio: 'inherit' // This preserves terminal interactivity
      });
      
      console.log(chalk.green('\n✅ Migration completed successfully'));
      
      // Success message
      console.log(chalk.bold.blue('\n📋 Next steps:'));
      console.log(chalk.cyan('  1. Your database is now updated with the latest schema'));
      console.log(chalk.cyan('  2. Prisma client has been automatically generated'));
      console.log(chalk.cyan('  3. Start your development server:'));
      console.log(chalk.gray('     npm run dev'));
      console.log('');
      
    } catch (error) {
      // The error will already be displayed to the user because of stdio: 'inherit'
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  }
} 