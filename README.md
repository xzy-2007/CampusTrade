# CampusTrade · 校园二手交易平台

## 项目简介

CampusTrade 是一个面向高校师生的校园内二手交易平台，旨在解决校园场景下二手物品信息分散、交易信任成本高的问题。平台提供商品浏览、搜索、发布、收藏、模拟购买及管理员审核等核心功能，帮助在校师生便捷地进行二手物品流转。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js (React) |
| 样式方案 | TailwindCSS |
| 后端框架 | Midway.js |
| ORM | TypeORM |
| 数据库 | MySQL |
| 接口规范 | OpenAPI 3.0 (contract-first) |
| 版本控制 | Git |

## 目录结构

```
CampusTrade/
├── README.md                  # 项目说明
├── LICENSE                    # 开源协议
├── .gitignore                 # Git 忽略规则
├── .editorconfig              # 编辑器统一配置
├── .env.example               # 环境变量模板
├── docs/                      # 设计文档
│   ├── SystemDesign.md        # 系统设计
│   ├── SPEC.md                # 功能规格说明
│   ├── DatabaseDesign.md      # 数据库设计
│   ├── TestPlan.md            # 测试计划
│   └── Deployment.md          # 部署方案
├── contracts/                 # 接口契约
│   └── openapi.yaml           # OpenAPI 3.0 规范（唯一事实来源）
├── frontend/                  # 前端项目（Next.js）
├── backend/                   # 后端项目（Midway.js）
├── database/                  # 数据库脚本
│   ├── migrations/            # 迁移脚本
│   └── seed/                  # 种子数据
├── tests/                     # 测试
│   ├── contract/              # 契约测试
│   ├── service/               # 服务层测试
│   ├── component/             # 组件测试
│   └── e2e/                   # 端到端测试
├── scripts/                   # 工具脚本
└── docker/                    # Docker 配置
```

## 开发流程

```
Design → SPEC → OpenAPI → Backend → Frontend → Test
```

1. **Design** — 系统设计评审（需求分析、架构设计、数据建模）
2. **SPEC** — 功能规格说明（FR 编号、验收标准）
3. **OpenAPI** — 接口契约定义（contract-first，前后端并行开发依据）
4. **Backend** — 后端 API 实现（Midway.js + TypeORM）
5. **Frontend** — 前端页面实现（Next.js + TailwindCSS）
6. **Test** — 契约测试 → 服务测试 → 组件测试 → E2E 测试

## 运行环境

> 待补充

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。