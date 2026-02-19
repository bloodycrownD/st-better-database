import type {DataStorage} from '@/infra/sql';
import type {RowData} from '@/infra/sql';

/**
 * DataStorage实现类
 *
 * 数据结构：
 * {
 *   tableIdx: [                  // 表ID
 *     {0: '张三', 1: 25},        // 第一行数据（字段ID -> 值）
 *     {0: '李四', 1: 30}         // 第二行数据
 *   ]
 * }
 */
export class SimpleDataStorage implements DataStorage {
    private data: Record<number, RowData[]> = {};

    constructor(data?: Record<number, RowData[]>) {
        if (data) {
            Object.keys(data).forEach(tableIdx => {
                const idx = parseInt(tableIdx);
                const rows = data[idx];
                if (rows) {
                    this.data[idx] = rows.map(row => ({...row}));
                }
            });
        }
    }

    /**
     * 克隆数据存储
     */
    clone(): DataStorage {
        const clonedData: Record<number, RowData[]> = {};
        Object.keys(this.data).forEach(tableIdx => {
            const idx = parseInt(tableIdx);
            const rows = this.data[idx];
            if (rows) {
                clonedData[idx] = rows.map(row => ({...row}));
            }
        });
        return new SimpleDataStorage(clonedData);
    }

    /**
     * 获取指定表的所有数据
     */
    getTableData(tableIdx: number): RowData[] {
        return this.data[tableIdx] || [];
    }

    /**
     * 设置指定表的数据
     */
    setTableData(tableIdx: number, data: RowData[]): void {
        this.data[tableIdx] = data.map(row => ({...row}));
    }

    /**
     * 清空所有数据
     */
    clear(): void {
        this.data = {};
    }

    /**
     * 序列化数据存储
     */
    serialize(): object {
        return this.data;
    }

    /**
     * 反序列化数据存储
     */
    deserialize(data: object): void {
        this.data = {};
        const dataObj = data as Record<string, RowData[]>;
        Object.keys(dataObj).forEach(tableIdx => {
            const idx = parseInt(tableIdx);
            const rows = dataObj[tableIdx];
            if (Array.isArray(rows)) {
                this.data[idx] = rows.map(row => ({...row}));
            } else {
                this.data[idx] = [];
            }
        });
    }
}
