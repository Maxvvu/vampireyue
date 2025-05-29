# 学生行为管理系统

这是一个基于Vue 3和Node.js的学生行为管理系统，用于记录和管理学生的行为表现。

## 功能特点

- 学生信息管理
- 行为记录管理
- 数据统计分析
- 用户认证
- 响应式界面设计

## 技术栈

### 前端
- Vue 3
- Element Plus
- Axios
- ECharts
- Vue Router
- Pinia

### 后端
- Node.js
- Express
- SQLite3
- JSON Web Token
- bcryptjs

## 安装说明

1. 克隆项目到本地

2. 安装前端依赖
```bash
cd frontend
npm install
```

3. 安装后端依赖
```bash
cd backend
npm install
```

## 运行项目

1. 启动后端服务器
```bash
cd backend
npm run dev
```

2. 启动前端开发服务器
```bash
cd frontend
npm run dev
```

## 默认账户

- 用户名：admin
- 密码：admin123

## 项目结构

```
.
├── frontend/               # 前端项目目录
│   ├── src/               # 源代码
│   │   ├── views/         # 页面组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   └── App.vue        # 根组件
│   └── package.json       # 前端依赖配置
│
└── backend/               # 后端项目目录
    ├── src/              # 源代码
    │   └── server.js     # 服务器入口文件
    └── package.json      # 后端依赖配置
```

## API接口

### 认证接口
- POST /api/auth/login - 用户登录

### 学生管理接口
- GET /api/students - 获取学生列表
- POST /api/students - 创建学生
- PUT /api/students/:id - 更新学生信息
- DELETE /api/students/:id - 删除学生

### 行为记录接口
- GET /api/behaviors - 获取行为记录列表
- POST /api/behaviors - 创建行为记录
- DELETE /api/behaviors/:id - 删除行为记录

### 统计分析接口
- GET /api/analysis/behavior-summary - 获取行为统计数据 # vampireyue
# vampireyue
# vampireyue
# vampireyue
# Students-Managerment
