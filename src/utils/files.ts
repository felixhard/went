import fs from 'fs';
import path from 'path';

/**
 * Ensure that a directory exists, creating it if it doesn't
 * @param dirPath Path to the directory to ensure exists
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy a file from source to destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 */
export function copyFile(sourcePath: string, destPath: string): void {
  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Read a file as text
 * @param filePath Path to the file to read
 * @returns The file contents as a string
 */
export function readFileAsText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Write text to a file
 * @param filePath Path to the file to write
 * @param content Content to write to the file
 */
export function writeTextToFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
}

/**
 * Check if a file exists
 * @param filePath Path to the file to check
 * @returns True if the file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Delete a file if it exists
 * @param filePath Path to the file to delete
 */
export function deleteFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
} 