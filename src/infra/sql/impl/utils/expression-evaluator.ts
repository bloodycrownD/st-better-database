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
                default:
                    throw new Error(`Unknown operator: ${expr.operator}`);
            }
        }

        if (expr.type === 'null') {
            if (row === null) {
                throw new Error('Cannot evaluate null expression without row context');
            }

            const value = this.evaluateExpression(expr.value, schema, tableIdx, row);
            return expr.not ? value !== null : value === null;
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
