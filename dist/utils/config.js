"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWentConfig = readWentConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Read and parse the went.config.ts file
 * @param configPathOption Optional path to the config file
 * @returns The parsed config object
 */
function readWentConfig(configPathOption) {
    const targetConfigFilename = 'went.config.ts';
    const userProjectDir = process.cwd(); // Get the directory where the user runs 'went'
    // Resolve config path relative to where the user runs the command
    const targetConfigPath = configPathOption
        ? path_1.default.resolve(userProjectDir, configPathOption)
        : path_1.default.resolve(userProjectDir, targetConfigFilename);
    if (!fs_1.default.existsSync(targetConfigPath)) {
        console.error(`Error: Configuration file not found at ${targetConfigPath}`);
        console.error(`Please create a '${targetConfigFilename}' file in the current directory, or specify a path using the --config <path> option.`);
        process.exit(1); // Exit with an error code
    }
    try {
        // --- Dynamic import of user's TypeScript config file ---
        // This section handles ts-node registration to allow 'require' for .ts files.
        const originalTsExtensions = require.extensions['.ts'];
        // Temporarily unregister .ts extension if already registered by another ts-node instance
        // This can help in scenarios where the CLI is linked globally and run multiple times.
        if (require.extensions['.ts']) {
            delete require.extensions['.ts'];
        }
        require('ts-node').register({
            compilerOptions: {
                module: 'commonjs', // Crucial for 'require' to work as expected
                // You might add other options here if needed for config file compilation
            },
            // transpileOnly: true, // Can speed up if type-checking of config is not needed here
        });
        // Clear the cache for the specific config file to ensure it's reloaded if changed
        if (require.cache[targetConfigPath]) {
            delete require.cache[targetConfigPath];
        }
        const userConfigModule = require(targetConfigPath);
        // Restore original .ts extension handler if it existed, otherwise clean up.
        if (originalTsExtensions) {
            require.extensions['.ts'] = originalTsExtensions;
        }
        else {
            delete require.extensions['.ts']; // Remove the one we added if none was there before
        }
        // --- End of dynamic import logic ---
        const userConfig = userConfigModule.default || userConfigModule;
        if (!userConfig || typeof userConfig !== 'object') {
            console.error(`Error: Invalid configuration structure in ${targetConfigPath}.`);
            console.error("Ensure the file exports a config object, like 'export default { ... };'.");
            process.exit(1);
        }
        // Ensure we have at least a default database configuration
        if (!userConfig.database) {
            userConfig.database = {
                provider: "postgresql"
            };
        }
        return userConfig;
    }
    catch (error) {
        console.error(`\n❌ Error reading configuration file:`);
        if (error instanceof Error) {
            console.error(`   Message: ${error.message}`);
        }
        else {
            console.error(`   An unknown error occurred: ${error}`);
        }
        process.exit(1);
    }
}
