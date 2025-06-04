import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { generatePrismaSchema } from './prismaSchemaBuilder';
import { readWentConfig } from '../utils/config';
import { ensureDirectoryExists } from '../utils/files';

/**
 * Command to generate Prisma schema based on went.config.ts settings
 */
export async function generatePrisma() {
  console.log(chalk.bold.blue('\n🚀 Went Prisma Schema Generator\n'));
  
  const mainSpinner = ora({
    text: chalk.blue(`Reading configuration...`),
    color: 'blue',
  }).start();
  
  try {
    // Read went.config.ts for Prisma entity configurations
    const config = readWentConfig();
    mainSpinner.succeed(chalk.green('Configuration loaded successfully'));
    
    // Generate schema based on configuration
    const schemaSpinner = ora({
      text: 'Generating Prisma schema from configuration...',
      color: 'cyan',
    }).start();
    
    const prismaSchema = generatePrismaSchema(config);
    schemaSpinner.succeed(chalk.green('Prisma schema generated'));
    
    // Determine output directory & file path
    const outputDir = path.join(process.cwd(), 'prisma');
    const schemaFilePath = path.join(outputDir, 'schema.prisma');
    
    // Ensure the prisma directory exists
    const fileSpinner = ora({
      text: 'Writing schema to file...',
      color: 'yellow',
    }).start();
    
    ensureDirectoryExists(outputDir);
    
    // Write the generated schema
    fs.writeFileSync(schemaFilePath, prismaSchema);
    fileSpinner.succeed(chalk.green(`Schema file written to ${chalk.bold('prisma/schema.prisma')}`));
    
    // Success messages
    console.log(chalk.bold.green('\n✅ Prisma schema generated successfully!'));
    
    // Check if we're using the default User model
    if (!config.prisma || !config.prisma.entities || config.prisma.entities.length === 0) {
      console.log(chalk.yellow('\nℹ️  Using default authentication models'));
      console.log(chalk.dim('   Define custom entities in went.config.ts to extend the schema'));
    }
    
    // Provide next steps
    console.log(chalk.bold.blue('\n📋 Next steps:'));
    console.log(chalk.cyan('  1. Review the schema in prisma/schema.prisma'));
    console.log(chalk.cyan('  2. Setup your database connection in .env file'));
    console.log(chalk.cyan('  3. Run migrations with:'));
    console.log(chalk.gray('     went db migrate init'));
    console.log(chalk.cyan('  4. Start your development server:'));
    console.log(chalk.gray('     npm run dev'));
    console.log('');
    
  } catch (error) {
    mainSpinner.fail(chalk.red('Failed to generate schema'));
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  }
}