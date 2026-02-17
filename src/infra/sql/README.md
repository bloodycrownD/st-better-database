# SQL 轻量级实现

## 概述

一个轻量级的SQL引擎，支持DDL、DML、DQL操作以及Row格式的批量数据操作。

## 核心特性

- 类型安全：基于TypeScript的强类型系统
- 职责分离：DataStorage存储数据，SqlExecutor管理表结构
- ID映射机制：表名和字段名使用数字ID映射，修改不影响数据
- 多种格式：支持SQL和Row JSON两种操作格式
- 数据快照：支持数据存储的克隆和快照功能

## 数据类型

系统仅支持两种基础数据类型：

- **NUMBER**：JavaScript Number类型，支持整数和浮点数
- **STRING**：字符串类型

## SQL操作类型

### DDL - 数据定义语言

用于定义和管理数据库结构，包括：

- 创建表（CREATE TABLE）
- 修改表结构（ALTER TABLE）
    - 添加列（ADD COLUMN）
    - 删除列（DROP COLUMN）
    - 重命名表（RENAME TO）
- 删除表（DROP TABLE）

### DML - 数据操作语言

用于操作数据库中的数据，包括：

- 插入数据（INSERT INTO）
- 字符串追加（APPEND INTO）：STRING类型专用，在原有值后追加内容
- 更新数据（UPDATE）
- 删除数据（DELETE）

### DQL - 数据查询语言

用于查询数据库中的数据，支持：

- 基础查询（SELECT）
- 条件查询（WHERE）：支持 =, !=, >, <, >=, <=, BETWEEN, IN, IS NULL 等条件
- 逻辑运算：AND, OR
- 排序（ORDER BY）：支持 ASC 和 DESC
- JOIN查询：支持 INNER JOIN 和 LEFT JOIN，仅支持单键等值连接

### Row格式操作

Row格式是JSON格式的批量数据操作方式，支持四种基本操作。

#### 操作类型

- **insert**：插入新行
- **append**：字符串追加（STRING类型专用）
- **update**：更新现有行
- **delete**：删除行

#### 字段说明

- action：操作类型
- tableIdx：表ID（数字自增）
- before：操作前的数据状态（UPDATE/DELETE需要），等价于WHERE条件
- after：操作后的数据状态（INSERT/APPEND/UPDATE需要）

详细格式说明请参考类型定义文件中的Row接口文档。

## 数据导出

支持三种导出格式：

- **INSERT_SQL**：导出为INSERT SQL语句
- **ROW_JSON**：导出为Row格式JSON
- **TABLE_SCHEMA**：导出表结构定义

## 数据结构

### 表结构映射

使用数字ID映射表名和字段名，实现表结构变更时的数据隔离。

结构包含以下字段：

- tableName：逻辑表名
- id2fieldName：字段ID到字段名的映射
- fieldName2id：字段名到字段ID的反向映射
- columnSchemas：字段ID到字段完整元数据的映射（包含类型、约束、默认值等）
- counter：字段ID计数器

### 数据存储

DataStorage仅存储数据快照，不包含表结构映射。

数据以表ID为key，值为该表的所有行数据数组，每行数据使用Map存储（字段ID -> 字段值）。

## 项目结构

```
src/infra/sql/
├── interfaces/      # 接口层（无实现）
│   ├── core/
│   │   └── sql-executor.ts      # SqlExecutor接口
│   └── storage/
│       └── data-storage.ts      # DataStorage接口
│
├── impl/            # 实现层（所有具体实现）
│   ├── core/
│   │   └── sql-executor.ts      # SimpleSqlExecutor实现
│   ├── storage/
│   │   └── data-storage.ts      # SimpleDataStorage实现
│   ├── executors/
│   │   ├── ddl-executor.ts      # DDL执行器
│   │   ├── dml-executor.ts      # DML执行器
│   │   ├── dql-executor.ts      # DQL执行器
│   │   └── index.ts
│   └── utils/
│       ├── expression-evaluator.ts  # 表达式求值
│       ├── data-exporter.ts         # 数据导出
│       ├── row-converter.ts          # Row格式转换
│       └── index.ts
│
├── types/           # 类型定义层
│   ├── core.ts      # SqlValue, RowData
│   ├── field.ts     # ColumnSchema
│   ├── table.ts     # TableSchema
│   ├── row.ts       # Row
│   ├── join.ts      # JoinCondition
│   └── result.ts    # SqlResult
│
├── enums/           # 枚举层
│   ├── field-type.ts
│   ├── action-type.ts
│   ├── sql-type.ts
│   ├── export-format.ts
│   ├── join-type.ts
│   └── sql-error-code.ts
│
├── errors/          # 错误类层
│   ├── sql-error.ts
│   ├── sql-syntax-error.ts
│   ├── sql-validation-error.ts
│   └── sql-execution-error.ts
│
├── parser/          # SQL解析器
│   ├── lexer.ts     # 词法分析
│   ├── parser.ts    # 语法分析
│   ├── ast.ts       # AST定义
│   └── index.ts
│
└── index.ts         # 统一导出入口
```

### 依赖层次

1. **enums层**：最底层，所有枚举常量定义
2. **types层**：类型定义层，依赖enums和types内部
3. **errors层**：错误类定义，依赖enums
4. **interfaces层**：接口定义，依赖types和enums

### 导入规则

- 从`../index`导入时，类型使用`import type { }`，枚举和类使用`import { }`
- types内部文件优先从types目录导入类型
- interfaces使用`import type { }`导入类型

## 工作原理

### ID映射机制

- 表名使用数字ID映射，修改表名不影响数据
- 字段名使用数字ID映射，修改字段名不影响数据
- 删除表或字段时，只删除映射关系

### 类型简化

- 只支持 NUMBER 和 STRING 两种类型
- NUMBER 对应 JavaScript Number 类型，可以是整数或浮点数
- 特殊的 APPEND 操作用于字符串拼接

### 轻量级查询

- 支持基础 WHERE 条件和逻辑运算
- 支持 ORDER BY 排序
- 支持简单的单键等值JOIN
- 不支持 GROUP BY、HAVING、子查询等复杂功能

### ID映射工作原理

```
表结构变更不影响数据示例：

初始状态：
  TableSchema:
    tableName: "users"
    id2fieldName: {0: "name", 1: "age"}
    fieldName2id: {"name": 0, "age": 1}
    columnSchemas: {0: {type: STRING, ...}, 1: {type: NUMBER, ...}}

  DataStorage:
    tableIdx: 0: [ {0: "张三", 1: 25}, {0: "李四", 1: 30} ]

重命名字段后：
  TableSchema:
    tableName: "users"
    id2fieldName: {0: "username", 1: "age"}  ← 字段名改变
    fieldName2id: {"username": 0, "age": 1}
    columnSchemas: {0: {type: STRING, ...}, 1: {type: NUMBER, ...}}

  DataStorage:
    tableIdx: 0: [ {0: "张三", 1: 25}, {0: "李四", 1: 30} ]  ← 数据不变，仍使用ID 0
```

**核心思想**：

- 数据存储使用稳定的数字ID（0, 1, 2...）而非易变的字符串名称
- 表结构变更仅修改映射关系，不触及实际数据
- 实现了结构变更与数据存储的完全解耦

### SqlExecutor与DataStorage交互流程

```
用户操作
    ↓
SqlExecutor.execute(sql)
    ↓
解析SQL → 验证类型
    ↓
┌─────────────────────┐
│ 获取表结构映射       │
│ tableIdx -> Schema  │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 访问DataStorage      │
│ 读写表数据          │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 返回SqlResult       │
└─────────────────────┘
```

**职责划分**：

- **SqlExecutor**：
    - 管理表结构映射（tableIdx -> TableSchema）
    - 解析SQL语句
    - 执行类型验证
    - 调用DataStorage进行数据操作
- **DataStorage**：
    - 仅存储数据快照
    - 提供表数据的增删改查接口
    - 支持克隆操作

## API接口文档

### SqlExecutor核心方法

#### execute(sql: string, sqlTypes: SqlType[]): SqlResult

执行SQL语句

**参数**：

- `sql`：SQL语句或Row格式的JSON字符串
- `sqlTypes`：允许的SQL类型数组，用于类型校验

**返回**：`SqlResult`

**异常**：

- `SqlSyntaxError`：SQL语法错误
- `SqlValidationError`：数据验证失败
- `SqlExecutionError`：执行异常

**示例**：

```typescript
// 执行DDL
executor.execute('CREATE TABLE users (name STRING, age NUMBER)', [SqlType.DDL]);

// 执行DML
executor.execute('INSERT INTO users (name, age) VALUES ("张三", 25)', [SqlType.DML]);

// 执行DQL
executor.execute('SELECT * FROM users WHERE age > 20', [SqlType.DQL]);

// 混合执行
executor.execute(sql, [SqlType.DQL, SqlType.DML, SqlType.DDL]);
```

#### export(format: ExportFormat, table?: string): string

导出数据

**参数**：

- `format`：导出格式（INSERT_SQL / ROW_JSON / TABLE_SCHEMA）
- `table`：可选，指定表名，不传则导出所有表

**返回**：导出结果字符串

#### dml2row(sql: string): string

将DML语句转换为Row格式

**参数**：`sql` - DML语句字符串，多条用';'分隔

**返回**：Row格式的JSON数组字符串

**示例**：

```typescript
// 转换
const dml = 'INSERT INTO users (name, age) VALUES ("张三", 25);';
const rowJson = executor.dml2row(dml);
// [{"action": "insert", "tableIdx": 0, "after": {"1": "张三", "2": 25}}]
```

#### row2dml(rows: string): string

将Row格式转换为DML语句

**参数**：`rows` - Row格式的JSON数组字符串

**返回**：DML语句字符串，多条用';'分隔

#### clone(): SqlExecutor

克隆执行器

**返回**：新的SqlExecutor实例（包含表结构映射和数据存储的深拷贝）

### DataStorage核心方法

#### clone(): DataStorage

克隆数据存储

#### getTableData(tableIdx: number): RowData[]

获取指定表的所有数据

#### setTableData(tableIdx: number, data: RowData[]): void

设置指定表的数据

#### clear(): void

清空所有数据

## 代码示例

### DDL操作

```typescript
// 创建表
executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);

// 添加列
executor.execute('ALTER TABLE users ADD COLUMN email STRING', [SqlType.DDL]);

// 重命名表
executor.execute('ALTER TABLE users RENAME TO accounts', [SqlType.DDL]);

// 删除列
executor.execute('ALTER TABLE accounts DROP COLUMN email', [SqlType.DDL]);

// 删除表
executor.execute('DROP TABLE accounts', [SqlType.DDL]);
```

### DML操作

```typescript
// 插入数据
executor.execute('INSERT INTO users (name, age) VALUES ("张三", 25)', [SqlType.DML]);

// 批量插入
executor.execute('INSERT INTO users (name, age) VALUES ("李四", 30), ("王五", 28)', [SqlType.DML]);

// 字符串追加
executor.execute('APPEND INTO users (name, 0) VALUES ("你好")', [SqlType.DML]);

// 更新数据
executor.execute('UPDATE users SET age = 26 WHERE name = "张三"', [SqlType.DML]);

// 删除数据
executor.execute('DELETE FROM users WHERE age < 20', [SqlType.DML]);
```

### DQL操作

```typescript
// 基础查询
executor.execute('SELECT * FROM users', [SqlType.DQL]);

// 条件查询
executor.execute('SELECT name, age FROM users WHERE age > 25', [SqlType.DQL]);

// 多条件查询
executor.execute('SELECT * FROM users WHERE age >= 20 AND age <= 30', [SqlType.DQL]);

// 排序
executor.execute('SELECT * FROM users ORDER BY age DESC', [SqlType.DQL]);

// JOIN查询
executor.execute('SELECT * FROM users INNER JOIN orders ON users.id = orders.userId', [SqlType.DQL]);
```

### Row格式操作

```typescript
// Row格式插入
const rowInsert = '[{"action": "insert", "tableIdx": 0, "after": {"0": "张三", "1": 25}}]';
executor.execute(rowInsert, [SqlType.ROW]);

// Row格式更新
const rowUpdate = '[{"action": "update", "tableIdx": 0, "before": {"0": "张三"}, "after": {"1": 26}}]';
executor.execute(rowUpdate, [SqlType.ROW]);

// Row格式删除
const rowDelete = '[{"action": "delete", "tableIdx": 0, "before": {"0": "李四"}}]';
executor.execute(rowDelete, [SqlType.ROW]);
```

### 数据导出

```typescript
// 导出为INSERT SQL
const insertSql = executor.export(ExportFormat.INSERT_SQL);

// 导出为Row JSON
const rowJson = executor.export(ExportFormat.ROW_JSON);

// 导出表结构
const schema = executor.export(ExportFormat.TABLE_SCHEMA);

// 导出指定表
const tableInsertSql = executor.export(ExportFormat.INSERT_SQL, 'users');
```

## 功能边界

### 支持的SQL语法

#### CREATE TABLE

```sql
CREATE TABLE tableName
(
    fieldName1 TYPE1,
    fieldName2 TYPE2, .
    .
    .
)
```

#### ALTER TABLE

```sql
-- 添加列
ALTER TABLE tableName
    ADD COLUMN fieldName TYPE

-- 删除列
ALTER TABLE tableName DROP COLUMN fieldName

-- 重命名表
ALTER TABLE tableName RENAME TO newTableName
```

#### INSERT

```sql
INSERT INTO tableName (field1, field2, ...)
VALUES (value1, value2, ...)
    INSERT
INTO tableName
VALUES (value1, value2, ...) -- 全字段插入
```

#### UPDATE

```sql
UPDATE tableName
SET field1 = value1,
    field2 = value2, ...WHERE condition
```

#### DELETE

```sql
DELETE
FROM tableName
WHERE condition
```

#### APPEND

```sql
APPEND
INTO tableName (fieldName, rowIdx) VALUES (value)
```

#### SELECT

```sql
SELECT field1,
       field2, ...
    FROM tableName
WHERE condition
ORDER BY field ASC / DESC

-- JOIN查询
SELECT *
FROM table1
    INNER/LEFT JOIN table2
ON table1.field = table2.field
```

### WHERE条件支持

- 比较运算符：`=`、`!=`、`>`、`<`、`>=`、`<=`
- 逻辑运算符：`AND`、`OR`
- 范围查询：`BETWEEN`
- 集合查询：`IN`
- 空值判断：`IS NULL`、`IS NOT NULL`

### 不支持的功能

- GROUP BY 分组查询
- HAVING 分组过滤
- 子查询
- 多表JOIN（仅支持单键等值连接）
- 聚合函数（COUNT, SUM, AVG等）
- 事务支持
- 索引
- 外键约束
- 唯一约束
- CHECK约束

### 数据类型限制

- 仅支持 NUMBER 和 STRING 两种类型
- NUMBER：JavaScript Number类型，注意精度问题
- STRING：字符串类型，无长度限制

### 性能限制

- 表数量：无硬性限制，但大量表会影响查询性能
- 单表字段数：建议不超过100个字段
- 单表数据行数：建议不超过100万行，超过后查询性能下降
- JOIN操作：仅支持单键等值连接，复杂JOIN需拆分为多次查询
