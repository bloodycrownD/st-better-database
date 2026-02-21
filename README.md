# 自定义数据库

[![Version](https://img.shields.io/badge/version-1.1.2-blue.svg)](https://github.com/bloodycrownD/st-custom-database)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## What - 项目简介

SillyTavern扩展，提供基于标准SQL语法的自定义数据库功能。支持CREATE、INSERT、UPDATE、DELETE、SELECT等常用操作（不支持JOIN），并将SQL语句转换为Row格式JSON，实现数据与表结构的解耦。

## Why - 为什么选择

相比SillyTavern原生的记忆表格和insertRow/deleteRow/updateRow语法：

- **更精确**：使用标准SQL的WHERE条件，AI操作数据更精准
- **更灵活**：修改表名或字段名不影响已有数据
- **更强大**：支持条件查询、排序、批量操作等

## Who & Where - 适用范围

面向所有需要在SillyTavern中进行结构化数据存储和操作的用户，适用于角色扮演、世界设定、关系管理等场景。

## How - 快速开始

### 安装

1. 下载本项目到SillyTavern扩展目录：
   ```
   https://github.com/bloodycrownD/st-custom-database
   ```

2. 重启SillyTavern

### 基础使用

在聊天界面或扩展界面输入SQL语句即可操作数据库。

#### 创建表

```sql
CREATE TABLE users (
  id NUMBER PRIMARY KEY AUTO_INCREMENT,
  name STRING NOT NULL,
  age NUMBER DEFAULT 18
) COMMENT '用户表';
```

#### 插入数据

```sql
INSERT INTO users (name, age) VALUES ('张三', 25);
INSERT INTO users (name, age) VALUES ('李四', 30);
```

#### 查询数据

```sql
SELECT * FROM users;
SELECT name, age FROM users WHERE age > 20;
```

#### 更新数据

```sql
UPDATE users SET age = 26 WHERE name = '张三';
```

#### 删除数据

```sql
DELETE FROM users WHERE age < 20;
```

## 功能特性

### 支持的SQL语法

**DDL（数据定义）**
- CREATE TABLE - 创建表
- ALTER TABLE - 修改表结构（ADD/DROP/CHANGE COLUMN，RENAME）
- DROP TABLE - 删除表

**DML（数据操作）**
- INSERT - 插入数据
- UPDATE - 更新数据
- DELETE - 删除数据
- APPEND - 字符串尾追（STRING类型专用）

**DQL（数据查询）**
- SELECT - 查询数据
- WHERE - 条件过滤（支持AND、OR、BETWEEN、IN、IS NULL等）
- ORDER BY - 排序

### 数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| NUMBER | 数字类型 | 123, 3.14 |
| STRING | 字符串类型 | 'hello', "world" |

### 约束支持

- PRIMARY KEY - 主键（支持单列和复合主键）
- AUTO_INCREMENT - 自增（NUMBER类型）

## 技术架构

- **核心引擎**：基于Vue 3 + Pinia构建
- **SQL解析**：自定义轻量级SQL解析器和执行器
- **数据存储**：使用ID映射机制，表名和字段名使用数字ID，修改名称不影响数据
- **版本管理**：采用数据快照设计，支持版本回溯
- **UI组件**：图形化表管理器，支持可视化编辑和SQL执行

## 开发者信息

- **作者**：bloodycrownD
- **主页**：https://github.com/bloodycrownD/st-custom-database
- **版本**：1.1.2

## License

MIT License
