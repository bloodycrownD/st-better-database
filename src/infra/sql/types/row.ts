import type {RowData} from './core';
import {ActionType} from '../enums/action-type';

/**
 * Row格式操作数据
 *
 * 用于JSON格式的批量数据操作，支持CRUD四种操作。
 *
 * 使用场景：
 * - 批量数据导入导出
 * - 数据同步
 * - 操作日志记录
 *
 * 字段说明：
 * - action: 操作类型（insert/append/update/delete）
 * - tableIdx: 表ID（数字自增）
 * - before: DELETE和UPDATE操作时的原数据状态，等价于WHERE条件
 * - after: INSERT、APPEND和UPDATE操作后的新数据状态
 *
 * 格式示例：
 *
 * 1. 插入操作：
 *    {"action": "insert", "tableIdx": 0, "after": {"0": "张三", "1": 25}}
 *
 * 2. 追加操作（STRING类型专用）：
 *    {"action": "append", "tableIdx": 1, "after": {"0": "新内容"}}
 *
 * 3. 更新操作：
 *    {
 *      "action": "update",
 *      "tableIdx": 0,
 *      "before": {"0": "李四", "1": 20},
 *      "after": {"0": "抹布", "1": "red"}
 *    }
 *
 * 4. 删除操作：
 *    {"action": "delete", "tableIdx": 0, "before": {"0": "李四"}}
 *
 * 字段说明：
 * - RowData中的key是字段ID，value是字段值
 * - before字段在UPDATE/DELETE中用作WHERE条件匹配行
 * - INSERT操作只需要after字段
 * - DELETE操作只需要before字段
 * - UPDATE操作需要before和after字段
 */
export interface Row {
    /** 操作类型 */
    action: ActionType;
    /** 目标表ID */
    tableIdx: number;
    /** 操作前的数据状态（UPDATE/DELETE需要） */
    before?: RowData;
    /** 操作后的数据状态（INSERT/APPEND/UPDATE需要） */
    after?: RowData;
}
