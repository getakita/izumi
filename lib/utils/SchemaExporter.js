export class SchemaExporter {
    /**
     * Export schema to JSON format
     */
    static exportToJSON(schema, options = { format: 'json' }) {
        const exportData = {
            version: schema.version || '1.0.0',
            database: schema.database,
            tables: schema.tables.map(table => ({
                name: table.name,
                columns: table.columns,
                ...(options.includeForeignKeys && table.foreignKeys && { foreignKeys: table.foreignKeys }),
                ...(options.includeIndexes && table.indexes && { indexes: table.indexes }),
            })),
            exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Export schema to TypeScript interface definitions
     */
    static exportToTypeScript(schema, options = { format: 'typescript' }) {
        let output = '// Generated TypeScript interfaces from database schema\n\n';
        for (const table of schema.tables) {
            output += this.generateTypeScriptInterface(table);
            output += '\n\n';
        }
        // Generate union types for table names
        const tableNames = schema.tables.map(t => `'${t.name}'`).join(' | ');
        output += `export type TableName = ${tableNames};\n\n`;
        // Generate a type for all tables
        output += 'export interface DatabaseTables {\n';
        for (const table of schema.tables) {
            const interfaceName = this.toPascalCase(table.name);
            output += `  ${table.name}: ${interfaceName};\n`;
        }
        output += '}\n';
        return output;
    }
    /**
     * Export schema to Drizzle ORM format
     */
    static exportToDrizzle(schema, options = { format: 'drizzle' }) {
        const importPath = options.importPath || 'drizzle-orm/pg-core';
        const camelCase = options.camelCase ?? true;
        let output = `// Generated Drizzle ORM schema\n`;
        output += `import { pgTable, text, integer, boolean, timestamp, serial, varchar, primaryKey, foreignKey, index } from '${importPath}';\n\n`;
        // Generate table definitions
        for (const table of schema.tables) {
            output += this.generateDrizzleTable(table, camelCase);
            output += '\n\n';
        }
        // Export all tables
        output += '// Export all tables\n';
        output += 'export {\n';
        for (const table of schema.tables) {
            const tableName = camelCase ? this.toCamelCase(table.name) : table.name;
            output += `  ${tableName},\n`;
        }
        output += '};\n\n';
        // Generate schema object
        output += 'export const schema = {\n';
        for (const table of schema.tables) {
            const tableName = camelCase ? this.toCamelCase(table.name) : table.name;
            output += `  ${tableName},\n`;
        }
        output += '};\n';
        return output;
    }
    /**
     * Generate TypeScript interface for a table
     */
    static generateTypeScriptInterface(table) {
        const interfaceName = this.toPascalCase(table.name);
        let output = `export interface ${interfaceName} {\n`;
        for (const column of table.columns) {
            const optional = column.nullable ? '?' : '';
            const type = this.mapSQLTypeToTypeScript(column.type);
            output += `  ${column.name}${optional}: ${type};\n`;
        }
        output += '}';
        return output;
    }
    /**
     * Generate Drizzle table definition
     */
    static generateDrizzleTable(table, camelCase) {
        const tableName = camelCase ? this.toCamelCase(table.name) : table.name;
        let output = `export const ${tableName} = pgTable('${table.name}', {\n`;
        for (const column of table.columns) {
            const columnDef = this.generateDrizzleColumn(column);
            output += `  ${column.name}: ${columnDef},\n`;
        }
        output += '}';
        // Add constraints if any
        if (table.foreignKeys && table.foreignKeys.length > 0) {
            output += ', (table) => ({\n';
            // Add foreign key constraints
            for (const fk of table.foreignKeys) {
                output += `  ${fk.column}Fk: foreignKey({\n`;
                output += `    columns: [table.${fk.column}],\n`;
                output += `    foreignColumns: [${this.toCamelCase(fk.referencedTable)}.${fk.referencedColumn}],\n`;
                output += `  }),\n`;
            }
            output += '})';
        }
        output += ');';
        return output;
    }
    /**
     * Generate Drizzle column definition
     */
    static generateDrizzleColumn(column) {
        let columnDef = '';
        // Map SQL types to Drizzle types
        const sqlType = column.type.toLowerCase();
        if (sqlType.includes('serial') || (sqlType.includes('int') && column.autoIncrement)) {
            columnDef = 'serial()';
        }
        else if (sqlType.includes('varchar') || sqlType.includes('text')) {
            const lengthMatch = column.type.match(/\((\d+)\)/);
            if (lengthMatch && sqlType.includes('varchar')) {
                columnDef = `varchar({ length: ${lengthMatch[1]} })`;
            }
            else {
                columnDef = 'text()';
            }
        }
        else if (sqlType.includes('int')) {
            columnDef = 'integer()';
        }
        else if (sqlType.includes('bool')) {
            columnDef = 'boolean()';
        }
        else if (sqlType.includes('timestamp') || sqlType.includes('datetime')) {
            columnDef = 'timestamp()';
        }
        else {
            // Default to text for unknown types
            columnDef = 'text()';
        }
        // Add modifiers
        if (column.primaryKey) {
            columnDef += '.primaryKey()';
        }
        if (!column.nullable && !column.primaryKey) {
            columnDef += '.notNull()';
        }
        if (column.unique) {
            columnDef += '.unique()';
        }
        if (column.defaultValue) {
            columnDef += `.default('${column.defaultValue}')`;
        }
        return columnDef;
    }
    /**
     * Map SQL types to TypeScript types
     */
    static mapSQLTypeToTypeScript(sqlType) {
        const type = sqlType.toLowerCase();
        if (type.includes('int') || type.includes('serial') || type.includes('numeric') || type.includes('decimal')) {
            return 'number';
        }
        if (type.includes('bool')) {
            return 'boolean';
        }
        if (type.includes('timestamp') || type.includes('date')) {
            return 'Date';
        }
        if (type.includes('json')) {
            return 'any';
        }
        // Default to string for text types and unknown types
        return 'string';
    }
    /**
     * Convert string to PascalCase
     */
    static toPascalCase(str) {
        return str
            .split(/[_\s-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    /**
     * Convert string to camelCase
     */
    static toCamelCase(str) {
        const pascalCase = this.toPascalCase(str);
        return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    }
}
