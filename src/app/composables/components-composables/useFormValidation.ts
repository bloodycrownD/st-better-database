import {computed, ref} from 'vue';
import type {ColumnSchema, TableSchema} from '@/infra/sql';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface ValidationOptions {
    /** 检查表名是否已存在 */
    checkTableNameExists?: (name: string) => boolean;
    /** 检查列名是否已存在 */
    checkColumnNameExists?: (name: string) => boolean;
    /** 排除当前名称（用于编辑场景） */
    excludeName?: string;
}

export function useFormValidation() {
    const errors = ref<ValidationError[]>([]);

    const hasErrors = computed(() => errors.value.length > 0);

    const getFieldError = (field: string): string | undefined => {
        return errors.value.find(e => e.field === field)?.message;
    };

    const clearErrors = () => {
        errors.value = [];
    };

    const addError = (field: string, message: string) => {
        errors.value.push({field, message});
    };

    /**
     * 验证表名
     */
    const validateTableName = (
        tableName: string,
        options?: ValidationOptions
    ): boolean => {
        const name = tableName.trim();

        if (!name) {
            addError('tableName', '请输入表名');
            return false;
        }

        if (name.length > 64) {
            addError('tableName', '表名长度不能超过64个字符');
            return false;
        }

        // 表名规则：字母、数字、下划线，不能以数字开头
        const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!namePattern.test(name)) {
            addError('tableName', '表名只能包含字母、数字和下划线，且不能以数字开头');
            return false;
        }

        // 检查是否已存在（排除当前名称）
        if (options?.checkTableNameExists && options.checkTableNameExists(name)) {
            if (options.excludeName && name === options.excludeName) {
                return true;
            }
            addError('tableName', `表 "${name}" 已存在`);
            return false;
        }

        return true;
    };

    /**
     * 验证列名
     */
    const validateColumnName = (
        columnName: string,
        options?: ValidationOptions
    ): boolean => {
        const name = columnName.trim();

        if (!name) {
            addError('columnName', '请输入列名');
            return false;
        }

        if (name.length > 64) {
            addError('columnName', '列名长度不能超过64个字符');
            return false;
        }

        // 列名规则：字母、数字、下划线，不能以数字开头
        const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!namePattern.test(name)) {
            addError('columnName', '列名只能包含字母、数字和下划线，且不能以数字开头');
            return false;
        }

        // 检查是否已存在（排除当前名称）
        if (options?.checkColumnNameExists && options.checkColumnNameExists(name)) {
            if (options.excludeName && name === options.excludeName) {
                return true;
            }
            addError('columnName', `列 "${name}" 已存在`);
            return false;
        }

        return true;
    };

    /**
     * 验证多个列名之间是否重复
     */
    const validateDuplicateColumnNames = (columns: Array<{ name: string }>): boolean => {
        const names = columns.map(col => col.name.trim()).filter(name => name);
        const duplicates: string[] = [];
        const seen = new Set<string>();

        for (const name of names) {
            if (seen.has(name)) {
                if (!duplicates.includes(name)) {
                    duplicates.push(name);
                }
            }
            seen.add(name);
        }

        if (duplicates.length > 0) {
            addError('columns', `存在重复的列名: ${duplicates.join(', ')}`);
            return false;
        }

        return true;
    };

    /**
     * 验证创建表表单
     */
    const validateCreateTableForm = (
        tableName: string,
        columns: ColumnSchema[],
        existingTables: TableSchema[]
    ): ValidationResult => {
        clearErrors();

        const existingTableNames = existingTables.map(t => t.tableName);

        // 验证表名
        validateTableName(tableName, {
            checkTableNameExists: (name) => existingTableNames.includes(name)
        });

        // 验证至少有一列
        if (columns.length === 0) {
            addError('columns', '请至少添加一列');
        }

        // 验证列名非空且符合规则
        const columnNames: string[] = [];
        columns.forEach((col, index) => {
            const colName = col.name.trim();
            if (!colName) {
                addError(`column_${index}`, `第 ${index + 1} 列的列名不能为空`);
            } else {
                columnNames.push(colName);
                // 验证列名规则
                const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                if (!namePattern.test(colName)) {
                    addError(`column_${index}`, `列 "${colName}" 只能包含字母、数字和下划线，且不能以数字开头`);
                }
            }
        });

        // 检查列名重复
        validateDuplicateColumnNames(columns);

        return {
            valid: errors.value.length === 0,
            errors: errors.value
        };
    };

    /**
     * 验证添加列表单
     */
    const validateAddColumnForm = (
        columnName: string,
        existingColumns: ColumnSchema[]
    ): ValidationResult => {
        clearErrors();

        const existingColumnNames = existingColumns.map(c => c.name);

        validateColumnName(columnName, {
            checkColumnNameExists: (name) => existingColumnNames.includes(name)
        });

        return {
            valid: errors.value.length === 0,
            errors: errors.value
        };
    };

    /**
     * 验证修改表名表单
     */
    const validateEditTableNameForm = (
        newName: string,
        currentName: string,
        existingTables: TableSchema[]
    ): ValidationResult => {
        clearErrors();

        const existingTableNames = existingTables.map(t => t.tableName);

        validateTableName(newName, {
            checkTableNameExists: (name) => existingTableNames.includes(name),
            excludeName: currentName
        });

        return {
            valid: errors.value.length === 0,
            errors: errors.value
        };
    };

    /**
     * 验证修改列名表单
     */
    const validateEditColumnNameForm = (
        newName: string,
        currentName: string,
        existingColumns: ColumnSchema[]
    ): ValidationResult => {
        clearErrors();

        const existingColumnNames = existingColumns.map(c => c.name);

        validateColumnName(newName, {
            checkColumnNameExists: (name) => existingColumnNames.includes(name),
            excludeName: currentName
        });

        return {
            valid: errors.value.length === 0,
            errors: errors.value
        };
    };

    /**
     * 验证注释
     */
    const validateComment = (comment: string, maxLength: number = 500): boolean => {
        if (comment && comment.length > maxLength) {
            addError('comment', `注释长度不能超过 ${maxLength} 个字符`);
            return false;
        }
        return true;
    };

    return {
        errors,
        hasErrors,
        getFieldError,
        clearErrors,
        addError,
        validateTableName,
        validateColumnName,
        validateDuplicateColumnNames,
        validateCreateTableForm,
        validateAddColumnForm,
        validateEditTableNameForm,
        validateEditColumnNameForm,
        validateComment
    };
}
