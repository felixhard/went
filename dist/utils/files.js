"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.copyFile = copyFile;
exports.readFileAsText = readFileAsText;
exports.writeTextToFile = writeTextToFile;
exports.fileExists = fileExists;
exports.deleteFileIfExists = deleteFileIfExists;
const fs_1 = __importDefault(require("fs"));
/**
 * Ensure that a directory exists, creating it if it doesn't
 * @param dirPath Path to the directory to ensure exists
 */
function ensureDirectoryExists(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Copy a file from source to destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 */
function copyFile(sourcePath, destPath) {
    fs_1.default.copyFileSync(sourcePath, destPath);
}
/**
 * Read a file as text
 * @param filePath Path to the file to read
 * @returns The file contents as a string
 */
function readFileAsText(filePath) {
    return fs_1.default.readFileSync(filePath, 'utf8');
}
/**
 * Write text to a file
 * @param filePath Path to the file to write
 * @param content Content to write to the file
 */
function writeTextToFile(filePath, content) {
    fs_1.default.writeFileSync(filePath, content);
}
/**
 * Check if a file exists
 * @param filePath Path to the file to check
 * @returns True if the file exists, false otherwise
 */
function fileExists(filePath) {
    return fs_1.default.existsSync(filePath);
}
/**
 * Delete a file if it exists
 * @param filePath Path to the file to delete
 */
function deleteFileIfExists(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
}
