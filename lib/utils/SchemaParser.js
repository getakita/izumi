export class SchemaParser {
    /**
     * Parse DDL SQL statements into a DatabaseSchema
     */
    static parseDDL(ddlContent) {
        const tables = [];
        // Simple regex-based DDL parser
        // In production, you might want to use a proper SQL parser
        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]*?)\);/gi;
        let match;
        while ((match = createTableRegex.exec(ddlContent)) !== null) {
            const tableName = match[1];
            const columnsText = match[2];
            const table = {
                name: tableName,
                columns: this.parseColumns(columnsText),
                primaryKey: this.extractPrimaryKey(columnsText),
                foreignKeys: this.extractForeignKeys(columnsText),
                indexes: [],
            };
            tables.push(table);
        }
        return {
            tables,
            version: '1.0.0',
        };
    }
    /**
     * Parse Drizzle schema object into DatabaseSchema
     */
    static parseDrizzleSchema(drizzleSchema) {
        const tables = [];
        for (const [tableName, tableDefinition] of Object.entries(drizzleSchema)) {
            if (tableDefinition && typeof tableDefinition === 'object' && tableDefinition._.name) {
                const table = {
                    name: tableDefinition._.name || tableName,
                    columns: this.parseDrizzleColumns(tableDefinition),
                    primaryKey: this.extractDrizzlePrimaryKey(tableDefinition),
                    foreignKeys: this.extractDrizzleForeignKeys(tableDefinition),
                    indexes: this.extractDrizzleIndexes(tableDefinition),
                };
                tables.push(table);
            }
        }
        return {
            tables,
            version: '1.0.0',
        };
    }
    /**
     * Convert a DatabaseSchema to a human-readable string for LLM context
     */
    static schemaToContext(schema) {
        let context = 'Database Schema:\n\n';
        for (const table of schema.tables) {
            context += `Table: ${table.name}\n`;
            context += 'Columns:\n';
            for (const column of table.columns) {
                context += `  - ${column.name}: ${column.type}`;
                if (!column.nullable)
                    context += ' NOT NULL';
                if (column.primaryKey)
                    context += ' PRIMARY KEY';
                if (column.unique)
                    context += ' UNIQUE';
                if (column.defaultValue)
                    context += ` DEFAULT ${column.defaultValue}`;
                context += '\n';
            }
            if (table.foreignKeys && table.foreignKeys.length > 0) {
                context += 'Foreign Keys:\n';
                for (const fk of table.foreignKeys) {
                    context += `  - ${fk.column} -> ${fk.referencedTable}.${fk.referencedColumn}\n`;
                }
            }
            context += '\n';
        }
        return context;
    }
    static parseColumns(columnsText) {
        const columns = [];
        const lines = columnsText.split(',').map(line => line.trim());
        for (const line of lines) {
            if (line.toLowerCase().includes('primary key') ||
                line.toLowerCase().includes('foreign key') ||
                line.toLowerCase().includes('constraint')) {
                continue;
            }
            const columnMatch = line.match(/`?(\w+)`?\s+(\w+(?:\([^)]*\))?)\s*(.*)/i);
            if (columnMatch) {
                const [, name, type, constraints] = columnMatch;
                const column = {
                    name,
                    type,
                    nullable: !constraints.toLowerCase().includes('not null'),
                    primaryKey: constraints.toLowerCase().includes('primary key'),
                    unique: constraints.toLowerCase().includes('unique'),
                    autoIncrement: constraints.toLowerCase().includes('auto_increment') ||
                        constraints.toLowerCase().includes('identity'),
                };
                // Extract default value
                const defaultMatch = constraints.match(/default\s+(['"]?)([^'"\s,]+)\1/i);
                if (defaultMatch) {
                    column.defaultValue = defaultMatch[2];
                }
                columns.push(column);
            }
        }
        return columns;
    }
    static extractPrimaryKey(columnsText) {
        const pkMatch = columnsText.match(/primary\s+key\s*\(([^)]+)\)/i);
        if (pkMatch) {
            return pkMatch[1].split(',').map(col => col.trim().replace(/`/g, ''));
        }
        return undefined;
    }
    static extractForeignKeys(columnsText) {
        const foreignKeys = [];
        const fkRegex = /foreign\s+key\s*\(([^)]+)\)\s+references\s+(\w+)\s*\(([^)]+)\)/gi;
        let match;
        while ((match = fkRegex.exec(columnsText)) !== null) {
            foreignKeys.push({
                column: match[1].trim().replace(/`/g, ''),
                referencedTable: match[2],
                referencedColumn: match[3].trim().replace(/`/g, ''),
            });
        }
        return foreignKeys;
    }
    static parseDrizzleColumns(tableDefinition) {
        const columns = [];
        // This is a simplified implementation
        // In practice, you'd need to inspect the Drizzle table definition more carefully
        if (tableDefinition._.columns) {
            for (const [columnName, columnDef] of Object.entries(tableDefinition._.columns)) {
                const column = {
                    name: columnName,
                    type: this.getDrizzleColumnType(columnDef),
                    nullable: !columnDef.notNull,
                    primaryKey: columnDef.primary || false,
                    unique: columnDef.unique || false,
                };
                columns.push(column);
            }
        }
        return columns;
    }
    static getDrizzleColumnType(columnDef) {
        // Map Drizzle column types to SQL types
        if (columnDef.dataType) {
            return columnDef.dataType;
        }
        // Add more mappings as needed
        return 'unknown';
    }
    static extractDrizzlePrimaryKey(tableDefinition) {
        // Extract primary key from Drizzle table definition
        const primaryKeys = [];
        if (tableDefinition._.columns) {
            for (const [columnName, columnDef] of Object.entries(tableDefinition._.columns)) {
                if (columnDef.primary) {
                    primaryKeys.push(columnName);
                }
            }
        }
        return primaryKeys.length > 0 ? primaryKeys : undefined;
    }
    static extractDrizzleForeignKeys(tableDefinition) {
        // Extract foreign keys from Drizzle table definition
        return []; // Implement based on Drizzle's foreign key structure
    }
    static extractDrizzleIndexes(tableDefinition) {
        // Extract indexes from Drizzle table definition
        return []; // Implement based on Drizzle's index structure
    }
}
