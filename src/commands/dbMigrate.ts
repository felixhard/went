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
  const name = migrationName || 'init';
  
  console.log(chalk.bold.blue('\n🚀 Went Database Migration Tool\n'));
  
  try {
    // Check if prisma directory and schema exist
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.log(chalk.red('\n❌ Error: Prisma schema not found'));
      console.log(chalk.yellow('Please ensure your project has a Prisma schema file'));
      process.exit(1);
    }
    
    // Check for .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log(chalk.yellow('\n⚠️ Warning: No .env file found'));
      console.log(chalk.gray('Make sure your database connection string is set correctly'));
    }
    
    // Check if this is the first migration
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const isFirstMigration = !fs.existsSync(migrationsPath) || fs.readdirSync(migrationsPath).length === 0;
    
    if (isFirstMigration) {
      console.log(chalk.blue('🔍 First migration detected'));
      console.log(chalk.gray('This will create your database tables and migration history\n'));
    } else {
      console.log(chalk.blue('🔄 Applying schema changes'));
      console.log(chalk.gray('This will create a new migration for your schema changes\n'));
    }
    
    // Always use migrate dev for consistency
    console.log(chalk.blue(`📝 Creating migration: ${chalk.bold(name)}`));
    
    try {
      execSync(`npx prisma migrate dev --name ${name}`, {
        stdio: 'inherit'
      });
      
      if (isFirstMigration) {
        console.log(chalk.green('\n✅ Database initialized successfully!'));
        console.log(chalk.blue('📁 Migration files created in prisma/migrations/'));
        console.log(chalk.blue('🗄️  All tables created in your database'));
      } else {
        console.log(chalk.green('\n✅ Migration applied successfully!'));
        console.log(chalk.blue('📁 New migration file created'));
        console.log(chalk.blue('🗄️  Database schema updated'));
      }
      
    } catch (error) {
      console.log(chalk.red('\n❌ Migration failed'));
      console.log(chalk.yellow('\nIf you see conflicts, you may need to:'));
      console.log(chalk.gray('  1. Review your schema changes'));
      console.log(chalk.gray('  2. Resolve any data conflicts manually'));
      console.log(chalk.gray('  3. Or run: npx prisma migrate reset (⚠️  will delete all data)'));
      process.exit(1);
    }
    
    // Generate Prisma client
    console.log(chalk.blue('\n🔄 Generating Prisma client...'));
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit'
      });
      console.log(chalk.green('✅ Prisma client generated'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Warning: Failed to generate Prisma client'));
    }
    
    // Success message with context-aware next steps
    console.log(chalk.bold.blue('\n📋 Next steps:'));
    if (isFirstMigration) {
      console.log(chalk.cyan('  1. Your database is now set up with all tables'));
      console.log(chalk.cyan('  2. Migration history tracking is initialized'));
      console.log(chalk.cyan('  3. Prisma client is ready to use'));
      console.log(chalk.cyan('  4. Start your development server:'));
      console.log(chalk.gray('     npm run dev'));
      console.log(chalk.blue('\n💡 Future schema changes:'));
      console.log(chalk.gray('   Use "went db migrate [name]" to create new migrations'));
    } else {
      console.log(chalk.cyan('  1. Your database schema has been updated'));
      console.log(chalk.cyan('  2. New migration has been recorded'));
      console.log(chalk.cyan('  3. Prisma client has been regenerated'));
      console.log(chalk.cyan('  4. Continue development:'));
      console.log(chalk.gray('     npm run dev'));
    }
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  }
} 