import type { Token, ComparisonNode, AstNode, SqlResult, ColumnMapping, Operator } from './types';

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  'sink.id': 'id',
  'sink.dupKey': 'dupKey',
  'sink.debug': 'debug',
  'sink.aiScore': 'aiScore',
  'sink.alert': 'alert',
  'sink.tag': 'tag',
  'sink.type': 'type',
  'sink.date': 'date',
  'sink.href': 'href',
  'sink.frame': 'frame',
  'sink.sink': 'sink',
  'sink.data': 'data',
  'sink.trace': 'trace',
  'sink.favorite': 'favorite'
};

/**
 * Parse and evaluate a condition string against data
 * @param condition - The condition string to parse
 * @param data - The data object to evaluate against
 * @returns The evaluation result
 */
export const parseCondition = (condition: string, data: Record<string, any>): boolean => {
    if (!condition) {
        return true;
    }

    // Tokenize the condition string
    const tokens = tokenize(condition);
    
    // Parse the tokens into an AST
    const ast = parseExpression(tokens);
    
    // Evaluate the AST against the data
    return evaluateExpression(ast, data);
};

/**
 * Convert parsed conditions to SQL WHERE clauses and parameters
 * @param condition - The condition string to parse
 * @param data - The data object (for validation, not used in SQL generation)
 * @returns Object with SQL where clauses and parameters
 */
export function conditionsToSql(
    condition: string, 
    data: Record<string, any>
): SqlResult {
    // Parse the condition to get the AST
    const tokens = tokenize(condition);
    const ast = parseExpression(tokens);
    
    // Convert AST to SQL using default column mapping
    const result = astToSql(ast, DEFAULT_COLUMN_MAPPING);
    
    return result;
}

/**
 * Tokenize the condition string into an array of tokens
 * @param condition - The condition string to tokenize
 * @returns Array of token objects with type and value properties
 */
function tokenize(condition: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    
    while (i < condition.length) {
        const char = condition[i];
        if (char === undefined) break;
        
        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        
        // Handle parentheses
        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char });
            i++;
            continue;
        }
        
        // Handle quoted strings
        if (char === '"') {
            let value = '';
            i++; // Skip opening quote
            while (i < condition.length) {
                if (condition[i] === '"') {
                    // Check if it's escaped
                    if (i > 0 && condition[i - 1] === '\\') {
                        // It's an escaped quote, add it to value and continue
                        value += '"';
                        i++;
                    } else {
                        // It's the closing quote
                        i++;
                        break;
                    }
                } else if (condition[i] === '\\' && i + 1 < condition.length && condition[i + 1] === '"') {
                    // Handle escaped quote
                    value += '"';
                    i += 2; // Skip both \ and "
                } else {
                    value += condition[i];
                    i++;
                }
            }
            tokens.push({ type: 'string', value });
            continue;
        }
        
        // Handle operators and identifiers
        if (/[a-zA-Z0-9._]/.test(char)) {
            let value = '';
            while (i < condition.length && condition[i] !== undefined && /[a-zA-Z0-9._]/.test(condition[i]!)) {
                value += condition[i]!;
                i++;
            }
            
            // Check if it's a logical operator
            if (value === 'AND' || value === 'OR') {
                tokens.push({ type: 'logical', value });
            } else {
                // Check if this is a comparison expression (object.property.operator)
                const parts = value.split('.');
                if (parts.length >= 3) {
                    // It's a comparison: object.property.operator
                    const objectPath = parts.slice(0, -1).join('.');
                    const operator = parts[parts.length - 1];
                    if (operator !== undefined) {
                        tokens.push({ type: 'identifier', value: objectPath });
                        tokens.push({ type: 'colon', value: ':' });
                        tokens.push({ type: 'identifier', value: operator });
                    }
                } else {
                    tokens.push({ type: 'identifier', value });
                }
            }
            continue;
        }
        
        // Handle colons
        if (char === ':') {
            tokens.push({ type: 'colon', value: ':' });
            i++;
            continue;
        }
        
        i++;
    }
    
    return tokens;
}

/**
 * Parse tokens into an Abstract Syntax Tree
 * @param tokens - Array of token objects
 * @returns AST node representing the parsed expression
 */
function parseExpression(tokens: Token[]): AstNode {
    let index = 0;
    
    /**
     * Parse OR expressions (lowest precedence)
     * @returns AST node for OR expression
     */
    function parseOr(): AstNode {
        let left = parseAnd();
        
        while (index < tokens.length && tokens[index] !== undefined && tokens[index]!.type === 'logical' && tokens[index]!.value === 'OR') {
            index++; // consume 'OR'
            let right = parseAnd();
            left = { type: 'or', left, right };
        }
        
        return left;
    }
    
    /**
     * Parse AND expressions (higher precedence than OR)
     * @returns AST node for AND expression
     */
    function parseAnd(): AstNode {
        let left = parsePrimary();
        
        while (index < tokens.length && tokens[index] !== undefined && tokens[index]!.type === 'logical' && tokens[index]!.value === 'AND') {
            index++; // consume 'AND'
            let right = parsePrimary();
            left = { type: 'and', left, right };
        }
        
        return left;
    }
    
    /**
     * Parse primary expressions (parentheses, comparisons)
     * @returns AST node for primary expression
     */
    function parsePrimary(): AstNode {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }
        
        const token = tokens[index];
        if (token === undefined) {
            throw new Error('Unexpected end of expression');
        }
        
        if (token.type === 'paren' && token.value === '(') {
            index++; // consume '('
            const expr = parseOr();
            if (index >= tokens.length || tokens[index] === undefined || tokens[index]!.type !== 'paren' || tokens[index]!.value !== ')') {
                throw new Error('Expected closing parenthesis');
            }
            index++; // consume ')'
            return expr;
        }
        
        if (token.type === 'identifier') {
            return parseComparison();
        }
        
        throw new Error(`Unexpected token: ${token.type}`);
    }
    
    /**
     * Parse comparison expressions (object.property.operator:"value")
     * @returns AST node for comparison expression
     */
    function parseComparison(): ComparisonNode {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }
        
        // Parse object.property
        const objectPathToken = tokens[index];
        if (objectPathToken === undefined) {
            throw new Error('Expected object path');
        }
        const objectPath = objectPathToken.value;
        index++;
        
        if (index >= tokens.length || tokens[index] === undefined || tokens[index]!.type !== 'colon') {
            throw new Error('Expected colon after object path');
        }
        index++; // consume ':'
        
        // Parse operator
        if (index >= tokens.length || tokens[index] === undefined || tokens[index]!.type !== 'identifier') {
            throw new Error('Expected operator');
        }
        const operatorToken = tokens[index];
        if (operatorToken === undefined) {
            throw new Error('Expected operator');
        }
        const operator = operatorToken.value;
        index++;
        
        if (index >= tokens.length || tokens[index] === undefined || tokens[index]!.type !== 'colon') {
            throw new Error('Expected colon after operator');
        }
        index++; // consume ':'
        
        // Parse value
        if (index >= tokens.length || tokens[index] === undefined || tokens[index]!.type !== 'string') {
            throw new Error('Expected string value');
        }
        const valueToken = tokens[index];
        if (valueToken === undefined) {
            throw new Error('Expected string value');
        }
        const value = valueToken.value;
        index++;
        
        return {
            type: 'comparison',
            objectPath,
            operator,
            value
        };
    }
    
    return parseOr();
}

/**
 * Evaluate the AST against the data
 * @param ast - The parsed AST node
 * @param data - The data object to evaluate against
 * @returns The evaluation result
 */
function evaluateExpression(ast: AstNode, data: Record<string, any>): boolean {
    if (ast.type === 'comparison') {
        return evaluateComparison(ast, data);
    } else if (ast.type === 'and') {
        return evaluateExpression(ast.left, data) && evaluateExpression(ast.right, data);
    } else if (ast.type === 'or') {
        return evaluateExpression(ast.left, data) || evaluateExpression(ast.right, data);
    }
    
    throw new Error(`Unknown AST node type: ${(ast as any).type}`);
}

/**
 * Evaluate a comparison operation
 * @param node - The comparison AST node
 * @param data - The data object to evaluate against
 * @returns The comparison result
 */
function evaluateComparison(node: ComparisonNode, data: Record<string, any>): boolean {
    const { objectPath, operator, value } = node;
    
    // Get the value from the data object
    const actualValue = getNestedValue(data, objectPath);
    
    // Convert to string for comparison
    const actualStr = String(actualValue);
    const expectedStr = String(value);
    
    switch (operator as Operator) {
        case 'eq':
            return actualStr === expectedStr;
        case 'ne':
        case 'neq':
            return actualStr !== expectedStr;
        case 'cont':
            return actualStr.includes(expectedStr);
        case 'ncont':
            return !actualStr.includes(expectedStr);
        case 'like':
            // Simple SQL-like pattern matching (supports % wildcards)
            const likePattern = expectedStr.replace(/%/g, '.*');
            const regex = new RegExp(`^${likePattern}$`, 'i');
            return regex.test(actualStr);
        case 'nlike':
            const nlikePattern = expectedStr.replace(/%/g, '.*');
            const nregex = new RegExp(`^${nlikePattern}$`, 'i');
            return !nregex.test(actualStr);
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
}

/**
 * Get nested value from object using dot notation
 * @param obj - The object to get the value from
 * @param path - The dot-separated path to the property
 * @returns The value at the specified path, or undefined if not found
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

/**
 * Convert AST to SQL WHERE clause and parameters
 * @param ast - The parsed AST
 * @param columnMapping - Mapping from object paths to SQL column names
 * @returns Object with SQL where clause and parameters
 */
function astToSql(ast: AstNode, columnMapping: ColumnMapping): SqlResult {
    if (ast.type === 'comparison') {
        return comparisonToSql(ast, columnMapping);
    } else if (ast.type === 'and') {
        const left = astToSql(ast.left, columnMapping);
        const right = astToSql(ast.right, columnMapping);
        return {
            whereClause: `(${left.whereClause} AND ${right.whereClause})`,
            params: [...left.params, ...right.params]
        };
    } else if (ast.type === 'or') {
        const left = astToSql(ast.left, columnMapping);
        const right = astToSql(ast.right, columnMapping);
        return {
            whereClause: `(${left.whereClause} OR ${right.whereClause})`,
            params: [...left.params, ...right.params]
        };
    }
    
    throw new Error(`Unknown AST node type: ${(ast as any).type}`);
}

/**
 * Convert comparison node to SQL
 * @param node - The comparison AST node
 * @param columnMapping - Mapping from object paths to SQL column names
 * @returns Object with SQL where clause and parameters
 */
function comparisonToSql(node: ComparisonNode, columnMapping: ColumnMapping): SqlResult {
    const { objectPath, operator, value } = node;
    
    // Get the SQL column name from mapping - throw error if not found
    const column = columnMapping[objectPath];
    if (!column) {
        throw new Error(`Invalid column path: ${objectPath}`);
    }
    
    switch (operator as Operator) {
        case 'eq':
            return {
                whereClause: `${column} = ?`,
                params: [value]
            };
            
        case 'ne':
        case 'neq':
            return {
                whereClause: `${column} != ?`,
                params: [value]
            };
            
        case 'like':
            return {
                whereClause: `${column} LIKE ?`,
                params: [value] // User provides the pattern with % wildcards
            };
            
        case 'nlike':
            return {
                whereClause: `${column} NOT LIKE ?`,
                params: [value] // User provides the pattern with % wildcards
            };
            
        case 'cont':
            return {
                whereClause: `${column} LIKE ?`,
                params: [`%${value}%`]
            };
            
        case 'ncont':
            return {
                whereClause: `${column} NOT LIKE ?`,
                params: [`%${value}%`]
            };
            
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
}
