import { SchemaParser } from '../utils/SchemaParser.js';
/**
 * Abstract base class for Izumi following the  pattern
 *
 * This class provides the core functionality for text-to-SQL conversion
 * and must be extended with concrete implementations for LLM and vector store
 */
export class IzumiBase {
    config;
    runSQL;
    runSQLIsSet = false;
    dialect;
    language;
    maxTokens;
    constructor(config = {}) {
        this.config = config;
        this.dialect = config.defaultDatabase || 'PostgreSQL';
        this.language = config.language;
        this.maxTokens = config.maxTokens || 14000;
        if (config.database) {
            this.runSQL = config.database.runSQL;
            this.runSQLIsSet = true;
            this.dialect = config.database.type;
        }
    }
    /**
     * Main method for asking questions and getting SQL + results
     * Following Vanna's ask() pattern
     */
    async ask(question, options = {}) {
        const { printResults = true, autoTrain = true, allowLLMToSeeData = false, } = options;
        try {
            // Generate SQL using the core method
            const sqlResponse = await this.generateSQL(question, {
                allowLLMToSeeData,
                includeExplanation: true,
            });
            if (printResults) {
                console.log('Generated SQL:', sqlResponse.sql);
                if (sqlResponse.explanation) {
                    console.log('Explanation:', sqlResponse.explanation);
                }
            }
            // If no database connection, return just the SQL
            if (!this.runSQLIsSet || !this.runSQL) {
                if (printResults) {
                    console.log('Connect to a database to run the SQL query.');
                }
                return {
                    sql: sqlResponse.sql,
                    results: null,
                    explanation: sqlResponse.explanation,
                };
            }
            try {
                // Run the SQL query
                const results = await this.runSQL(sqlResponse.sql);
                if (printResults) {
                    console.log('Results:', results);
                }
                // Auto-train if results were successful and autoTrain is enabled
                if (results && autoTrain) {
                    await this.addQuestionSQL(question, sqlResponse.sql);
                }
                return {
                    sql: sqlResponse.sql,
                    results,
                    explanation: sqlResponse.explanation,
                };
            }
            catch (error) {
                console.error('Error running SQL:', error);
                return {
                    sql: sqlResponse.sql,
                    results: null,
                    explanation: sqlResponse.explanation,
                };
            }
        }
        catch (error) {
            console.error('Error generating SQL:', error);
            return {
                sql: null,
                results: null,
            };
        }
    }
    /**
     * Train the model with various types of data
     * Following Vanna's train() pattern
     */
    async train(params) {
        const { question, sql, ddl, documentation, plan } = params;
        if (question && !sql) {
            throw new Error('Please also provide a SQL query when training with a question');
        }
        if (documentation) {
            console.log('Adding documentation...');
            return this.addDocumentation(documentation);
        }
        if (sql) {
            let trainingQuestion = question;
            if (!trainingQuestion) {
                trainingQuestion = await this.generateQuestion(sql);
                console.log('Generated question for SQL:', trainingQuestion);
            }
            console.log('Adding question-SQL pair...');
            return this.addQuestionSQL(trainingQuestion, sql);
        }
        if (ddl) {
            console.log('Adding DDL:', ddl);
            return this.addDDL(ddl);
        }
        if (plan) {
            let results = '';
            for (const item of plan.items) {
                switch (item.type) {
                    case 'ddl':
                        results += await this.addDDL(item.value) + '\n';
                        break;
                    case 'documentation':
                        results += await this.addDocumentation(item.value) + '\n';
                        break;
                    case 'question-sql':
                        results += await this.addQuestionSQL(item.name, item.value) + '\n';
                        break;
                }
            }
            return results;
        }
        throw new Error('Please provide at least one of: question+sql, ddl, documentation, or plan');
    }
    /**
     * Core SQL generation method
     * Following Vanna's generate_sql() pattern
     */
    async generateSQL(question, options = {}) {
        const { allowLLMToSeeData = false } = options;
        // Get related context using RAG
        const questionSQLList = await this.getSimilarQuestionSQL(question);
        const ddlList = await this.getRelatedDDL(question);
        const docList = await this.getRelatedDocumentation(question);
        // Build prompt
        const prompt = this.getSQLPrompt({
            question,
            questionSQLList,
            ddlList,
            docList,
            options,
        });
        console.log('SQL Prompt generated');
        // Submit to LLM
        const llmResponse = await this.submitPrompt(prompt);
        console.log('LLM Response received');
        // Extract SQL
        let sql = this.extractSQL(llmResponse);
        // Handle intermediate SQL if needed
        if (sql.includes('intermediate_sql') && allowLLMToSeeData && this.runSQL) {
            try {
                console.log('Running intermediate SQL...');
                const intermediateSQL = this.extractSQL(sql);
                const intermediateResults = await this.runSQL(intermediateSQL);
                // Generate final SQL with intermediate results
                const finalPrompt = this.getSQLPrompt({
                    question,
                    questionSQLList,
                    ddlList,
                    docList: [...docList, {
                            id: 'intermediate-results',
                            documentation: `Intermediate results: ${JSON.stringify(intermediateResults)}`,
                            title: 'Intermediate Query Results'
                        }],
                    options,
                });
                const finalResponse = await this.submitPrompt(finalPrompt);
                sql = this.extractSQL(finalResponse);
            }
            catch (error) {
                console.error('Error running intermediate SQL:', error);
            }
        }
        // Generate Drizzle query if requested
        let drizzleQuery;
        if (options.outputFormat === 'drizzle') {
            drizzleQuery = await this.sqlToDrizzle(sql);
        }
        // Extract explanation if requested
        let explanation;
        if (options.includeExplanation) {
            explanation = this.extractExplanation(llmResponse);
        }
        return {
            sql,
            drizzleQuery,
            explanation,
            metadata: {
                tablesUsed: this.extractTablesUsed(sql),
                columnsUsed: this.extractColumnsUsed(sql),
                queryType: this.extractQueryType(sql),
                similarQuestions: questionSQLList,
                relatedDDL: ddlList,
                relatedDocs: docList,
            },
        };
    }
    /**
     * Extract SQL from LLM response
     * Following Vanna's extract_sql() pattern
     */
    extractSQL(llmResponse) {
        // Match various SQL patterns
        const patterns = [
            /```sql\s*\n(.*?)```/is,
            /```\s*\n(.*?)```/is,
            /\bCREATE\s+TABLE\b.*?\bAS\b.*?;/is,
            /\bWITH\b .*?;/is,
            /\bSELECT\b .*?;/is,
        ];
        for (const pattern of patterns) {
            const match = llmResponse.match(pattern);
            if (match) {
                return match[1]?.trim() || match[0].trim();
            }
        }
        return llmResponse.trim();
    }
    /**
     * Convert SQL to Drizzle ORM syntax
     */
    async sqlToDrizzle(sql) {
        const prompt = [
            this.systemMessage(`Convert the following SQL query to Drizzle ORM TypeScript code. 
        Use proper Drizzle query builder syntax and include necessary imports.`),
            this.userMessage(sql),
        ];
        const response = await this.submitPrompt(prompt);
        return this.extractCode(response, 'typescript');
    }
    /**
     * Generate a question from SQL
     */
    async generateQuestion(sql) {
        const prompt = [
            this.systemMessage(`Generate a natural language question that this SQL query answers. 
        Return only the question without explanations.`),
            this.userMessage(sql),
        ];
        return this.submitPrompt(prompt);
    }
    /**
     * Automatically generate training data from database schema
     * Uses LLM to analyze schema and create relevant question-SQL pairs
     */
    async generateTrainingDataFromSchema(options = {}) {
        const { numQuestions = 10, includeBasicQueries = true, includeAdvancedQueries = true, includeAnalyticsQueries = true, customPrompt } = options;
        // Get current training data to understand what's already covered
        const existingData = await this.getTrainingData();
        const existingQuestions = new Set(existingData.questionSQL.map(q => q.question.toLowerCase()));
        // Get schema information
        const schemaInfo = await this.getSchemaInfo();
        if (!schemaInfo || schemaInfo.tables.length === 0) {
            throw new Error('No schema information available. Please train with DDL statements first.');
        }
        console.log(`Analyzing schema with ${schemaInfo.tables.length} tables...`);
        // Generate training data using LLM
        const generatedQuestions = [];
        // Define query categories
        const categories = [];
        if (includeBasicQueries)
            categories.push('basic CRUD operations');
        if (includeAdvancedQueries)
            categories.push('complex joins and subqueries');
        if (includeAnalyticsQueries)
            categories.push('analytics and reporting');
        for (const category of categories) {
            const prompt = customPrompt || this.buildSchemaAnalysisPrompt(schemaInfo, category, numQuestions / categories.length);
            try {
                const response = await this.submitPrompt([this.systemMessage(prompt)]);
                const newQuestions = this.parseGeneratedQuestions(response);
                // Filter out duplicates and add to results
                for (const q of newQuestions) {
                    if (!existingQuestions.has(q.question.toLowerCase())) {
                        generatedQuestions.push(q);
                        existingQuestions.add(q.question.toLowerCase());
                    }
                }
            }
            catch (error) {
                console.error(`Error generating ${category} questions:`, error);
            }
        }
        // Train with the generated data
        let trained = 0;
        for (const questionPair of generatedQuestions) {
            try {
                await this.addQuestionSQL(questionPair.question, questionPair.sql);
                trained++;
                console.log(`Trained: "${questionPair.question}"`);
            }
            catch (error) {
                console.error(`Failed to train: "${questionPair.question}"`, error);
            }
        }
        return {
            generated: trained,
            questions: generatedQuestions
        };
    }
    /**
     * Get schema information from training data
     */
    async getSchemaInfo() {
        const trainingData = await this.getTrainingData();
        if (trainingData.ddl.length === 0) {
            return null;
        }
        // Combine all DDL statements
        const combinedDDL = trainingData.ddl.map(d => d.ddl).join('\n\n');
        // Parse the schema
        return SchemaParser.parseDDL(combinedDDL);
    }
    /**
     * Build prompt for schema analysis
     */
    buildSchemaAnalysisPrompt(schema, category, numQuestions) {
        let prompt = `You are a SQL expert. Analyze the following database schema and generate ${Math.ceil(numQuestions)} diverse ${category} questions with their corresponding SQL queries.

Database Schema:
`;
        // Add table information
        for (const table of schema.tables) {
            prompt += `\nTable: ${table.name}\n`;
            prompt += `Columns:\n`;
            for (const col of table.columns) {
                prompt += `  - ${col.name} (${col.type})${col.nullable ? '' : ' NOT NULL'}${col.primaryKey ? ' PRIMARY KEY' : ''}\n`;
            }
            if (table.primaryKey && table.primaryKey.length > 0) {
                prompt += `Primary Key: ${table.primaryKey.join(', ')}\n`;
            }
            if (table.foreignKeys && table.foreignKeys.length > 0) {
                prompt += `Foreign Keys:\n`;
                for (const fk of table.foreignKeys) {
                    prompt += `  - ${fk.column} -> ${fk.referencedTable}.${fk.referencedColumn}\n`;
                }
            }
        }
        prompt += `

Requirements:
1. Generate realistic, practical questions that users might actually ask
2. Ensure SQL queries are syntactically correct for ${this.dialect}
3. Cover different types of operations appropriate for the category
4. Use proper table and column names from the schema
5. Include WHERE clauses, JOINs, aggregations, etc. as appropriate

Format your response as:
Question: [Natural language question]
SQL: [SQL query]

Question: [Next question]
SQL: [Next SQL query]

...`;
        return prompt;
    }
    /**
     * Parse generated questions from LLM response
     */
    parseGeneratedQuestions(response) {
        const questions = [];
        const lines = response.split('\n');
        let currentQuestion = '';
        let currentSQL = '';
        for (const line of lines) {
            if (line.startsWith('Question:')) {
                if (currentQuestion && currentSQL) {
                    questions.push({
                        question: currentQuestion.trim(),
                        sql: currentSQL.trim()
                    });
                }
                currentQuestion = line.substring(9).trim();
                currentSQL = '';
            }
            else if (line.startsWith('SQL:')) {
                currentSQL = line.substring(4).trim();
            }
            else if (currentSQL && line.trim()) {
                // Continue SQL if it spans multiple lines
                currentSQL += '\n' + line.trim();
            }
        }
        // Add the last pair
        if (currentQuestion && currentSQL) {
            questions.push({
                question: currentQuestion.trim(),
                sql: currentSQL.trim()
            });
        }
        return questions;
    }
    // Message creation helpers
    systemMessage(content) {
        return { role: 'system', content };
    }
    userMessage(content) {
        return { role: 'user', content };
    }
    assistantMessage(content) {
        return { role: 'assistant', content };
    }
    // Helper methods
    getSQLPrompt(params) {
        const { question, questionSQLList, ddlList, docList, options } = params;
        const outputFormat = options.outputFormat || 'sql';
        let systemPrompt = `You are a ${this.dialect} expert. Generate a ${outputFormat.toUpperCase()} query to answer the question. Your response should ONLY be based on the given context.`;
        // Add DDL information
        if (ddlList.length > 0) {
            systemPrompt += '\n\n===Tables\n';
            for (const ddl of ddlList) {
                systemPrompt += `${ddl.ddl}\n\n`;
            }
        }
        // Add documentation
        if (docList.length > 0) {
            systemPrompt += '\n\n===Additional Context\n';
            for (const doc of docList) {
                systemPrompt += `${doc.documentation}\n\n`;
            }
        }
        // Add guidelines
        systemPrompt += '\n\n===Response Guidelines\n';
        systemPrompt += '1. Generate valid SQL without explanations if context is sufficient\n';
        systemPrompt += '2. Use intermediate_sql comment if you need to explore data first\n';
        systemPrompt += '3. Explain if context is insufficient\n';
        systemPrompt += '4. Use the most relevant tables\n';
        systemPrompt += `5. Ensure ${this.dialect}-compliant syntax\n`;
        if (outputFormat === 'drizzle') {
            systemPrompt += '6. Generate Drizzle ORM TypeScript code with proper imports\n';
        }
        const messages = [this.systemMessage(systemPrompt)];
        // Add example question-SQL pairs
        for (const example of questionSQLList.slice(0, 3)) {
            messages.push(this.userMessage(example.question));
            messages.push(this.assistantMessage(example.sql));
        }
        // Add the actual question
        messages.push(this.userMessage(question));
        return messages;
    }
    extractCode(response, language) {
        const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
        const match = response.match(codeBlockRegex);
        return match ? match[1].trim() : response.trim();
    }
    extractExplanation(response) {
        const explanationRegex = /(?:Explanation|Description):\s*(.*?)(?:\n\n|$)/is;
        const match = response.match(explanationRegex);
        return match ? match[1].trim() : undefined;
    }
    extractTablesUsed(sql) {
        // Simple regex to extract table names - could be enhanced
        const tableRegex = /FROM\s+(\w+)|JOIN\s+(\w+)|UPDATE\s+(\w+)|INSERT\s+INTO\s+(\w+)/gi;
        const tables = new Set();
        let match;
        while ((match = tableRegex.exec(sql)) !== null) {
            const tableName = match[1] || match[2] || match[3] || match[4];
            if (tableName) {
                tables.add(tableName);
            }
        }
        return Array.from(tables);
    }
    extractColumnsUsed(sql) {
        // This is a simplified implementation
        return [];
    }
    extractQueryType(sql) {
        const upperSQL = sql.toUpperCase().trim();
        if (upperSQL.startsWith('SELECT'))
            return 'SELECT';
        if (upperSQL.startsWith('INSERT'))
            return 'INSERT';
        if (upperSQL.startsWith('UPDATE'))
            return 'UPDATE';
        if (upperSQL.startsWith('DELETE'))
            return 'DELETE';
        return 'SELECT';
    }
    // Utility methods
    log(message, title = 'Info') {
        console.log(`${title}: ${message}`);
    }
    responseLanguage() {
        return this.language ? `Respond in the ${this.language} language.` : '';
    }
}
