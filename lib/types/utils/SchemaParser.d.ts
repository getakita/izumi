import { DatabaseSchema } from '../types/index.js';
export declare class SchemaParser {
    /**
     * Parse DDL SQL statements into a DatabaseSchema
     */
    static parseDDL(ddlContent: string): DatabaseSchema;
    /**
     * Parse Drizzle schema object into DatabaseSchema
     */
    static parseDrizzleSchema(drizzleSchema: Record<string, any>): DatabaseSchema;
    /**
     * Convert a DatabaseSchema to a human-readable string for LLM context
     */
    static schemaToContext(schema: DatabaseSchema): string;
    private static parseColumns;
    private static extractPrimaryKey;
    private static extractForeignKeys;
    private static parseDrizzleColumns;
    private static getDrizzleColumnType;
    private static extractDrizzlePrimaryKey;
    private static extractDrizzleForeignKeys;
    private static extractDrizzleIndexes;
}
//# sourceMappingURL=SchemaParser.d.ts.map