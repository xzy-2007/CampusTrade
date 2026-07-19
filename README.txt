# CampusTrade

## 1. 项目简介

CampusTrade 是一个面向高校师生的校园内二手交易平台，旨在解决校园场景下二手物品信息分散、交易信任成本高的问题。平台提供商品浏览、搜索、发布、收藏、模拟购买及管理员审核等核心功能，帮助在校师生便捷地进行二手物品流转。

## 2. GitHub 仓库地址

TODO

## 3. 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js (React) |
| 样式方案 | TailwindCSS |
| 后端框架 | Midway.js |
| ORM | TypeORM |
| 数据库 | MySQL |
| 接口规范 | OpenAPI 3.0 (contract-first) |
| 版本控制 | Git |
| 容器化 | Docker / Docker Compose |

## 4. Docker 启动方式

TODO

### Docker Compose 启动命令

```bash
docker-compose up -d
```

### Docker Image 启动命令

```bash
docker run -d --name campus-trade -p 7001:7001 -p 3000:3000 <image-name>
```

## 5. 数据库配置和挂载说明

### 数据库配置

TODO

### 数据持久化挂载

```yaml
volumes:
  - ./database/init:/docker-entrypoint-initdb.d
  - mysql-data:/var/lib/mysql
```

## 6. 资源文件挂载说明

### 图片资源挂载

```yaml
volumes:
  - ./resources/goods:/app/resources/goods
  - ./resources/avatar:/app/resources/avatar
```

## 7. Web 访问地址

### 前端页面

TODO

### 后端 API 服务

TODO

## 8. 本地运行说明

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- npm / pnpm

### 后端启动

```bash
cd backend
npm install
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

## 9. 课程学习总结

TODO

## 10. 课程改进建议

TODO