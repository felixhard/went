export interface WentConfigEntityField {
    type: string; // e.g., "String", "Int", "Boolean"
    isId?: boolean;
    isUnique?: boolean;
    isOptional?: boolean;
    defaultValue?: string | number | boolean; // e.g., "cuid()", "now()", false
    // Add more attributes like relations later
  }
  
  export interface WentConfigEntity {
    name: string; // e.g., "User", "Post"
    fields: Record<string, WentConfigEntityField | string>; // string for prisma type shorthand
  }
  
  export interface WentDatabaseConfig {
    provider: "postgresql" | "mysql" | "sqlite";
    // Additional database-specific settings
  }
  
  export interface WentConfig {
    projectName?: string; // Project name
    
    database?: WentDatabaseConfig; // Database configuration
    
    prisma?: { // Grouping Prisma related config
      entities: WentConfigEntity[];
      // datasourceUrl?: string; // For later
    };
    
    // Add other top-level configs later: pages, auth, etc.
  }