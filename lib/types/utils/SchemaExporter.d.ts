import { DatabaseSchema, SchemaExportOptions } from '../types/index.js';
export declare class SchemaExporter {
    /**
     * Export schema to JSON format
     */
    static exportToJSON(schema: DatabaseSchema, options?: SchemaExportOptions): string;
    /**
     * Export schema to TypeScript interface definitions
     */
    static exportToTypeScript(schema: DatabaseSchema, options?: SchemaExportOptions): string;
    /**
     * Export schema to Drizzle ORM format
     */
    static exportToDrizzle(schema: DatabaseSchema, options?: SchemaExportOptions): string;
    /**
     * Generate TypeScript interface for a table
     */
    private static generateTypeScriptInterface;
    /**
     * Generate Drizzle table definition
     */
    private static generateDrizzleTable;
    /**
     * Generate Drizzle column definition
     */
    private static generateDrizzleColumn;
    /**
     * Map SQL types to TypeScript types
     */
    private static mapSQLTypeToTypeScript;
    /**
     * Convert string to PascalCase
     */
    private static toPascalCase;
    /**
     * Convert string to camelCase
     */
    private static toCamelCase;
}
//# sourceMappingURL=SchemaExporter.d.ts.map