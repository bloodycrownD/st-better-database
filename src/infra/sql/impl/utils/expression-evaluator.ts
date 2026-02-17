import type {RowData, TableSchema} from '../../index';

export class ExpressionEvaluator {
    evaluateExpression(
        expr: any,
        schema: TableSchema,
        tableIdx: number,
        row: RowData | null
    ): any {
        if (expr.type === 'value') {
            return expr.value;
        }

        if (expr.type === 'column') {
            if (row === null) {
                throw new Error('Cannot evaluate column expression without row context');
            }

            const colName = expr.name;
            const fieldIdx = schema.fieldName2id.get(colName);
            if (fieldIdx === undefined) {
                throw new Error(`Column '${colName}' does not exist`);
            }

            return row.get(fieldIdx);
        }

        if (expr.type === 'binary') {
            const left = this.evaluateExpression(expr.left, schema, tableIdx, row);
            const right = this.evaluateExpression(expr.right, schema, tableIdx, row);

            switch (expr.operator) {
                case '+':
                    return Number(left) + Number(right);
                case '-':
                    return Number(left) - Number(right);
                case '*':
                    return Number(left) * Number(right);
                case '/':
                    return Number(left) / Number(right);
                case '=':
                    return left === right;
                case '!=':
                case '<>':
                    return left !== right;
                case '>':
                    return Number(left) > Number(right);
                case '<':
                    return Number(left) < Number(right);
                case '>=':
                    return Number(left) >= Number(right);
                case '<=':
                    return Number(left) <= Number(right);
                case 'AND':
                    return Boolean(left) && Boolean(right);
                case 'OR':
                    return Boolean(left) || Boolean(right);
                case 'IS':
                    return left === right;
                case 'IS NOT':
                    return left !== right;
                default:
                    throw new Error(`Unknown operator: ${expr.operator}`);
            }
        }

        if (expr.type === 'null') {
            // Check if this is a simple NULL value (from parser: {type: 'null', value: {type: 'value', value: null}})
            if (expr.value && expr.value.type === 'value' && expr.value.value === null) {
                return null;
            }
            // Otherwise, this is an IS NULL / IS NOT NULL expression
            const value = this.evaluateExpression(expr.value, schema, tableIdx, row);
            return expr.not ? value !== null : value === null;
        }

        if (expr.type === 'in') {
            const value = this.evaluateExpression(expr.value, schema, tableIdx, row);
            const values = expr.values.map((v: any) => this.evaluateExpression(v, schema, tableIdx, row));
            return values.some((v: any) => v === value);
        }

        if (expr.type === 'between') {
            const value = this.evaluateExpression(expr.value, schema, tableIdx, row);
            const min = this.evaluateExpression(expr.min, schema, tableIdx, row);
            const max = this.evaluateExpression(expr.max, schema, tableIdx, row);
            return value >= min && value <= max;
        }

        throw new Error(`Unknown expression type: ${expr.type}`);
    }

    evaluateWhere(
        expr: any,
        schema: TableSchema,
        tableIdx: number,
        row: RowData
    ): boolean {
        return Boolean(this.evaluateExpression(expr, schema, tableIdx, row));
    }
}
