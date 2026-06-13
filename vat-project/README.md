# 增值税混合销售智能判定工具

基于 2026 年新《增值税法》及财政部 税务总局公告 2026 年第 13 号，帮助判断业务是否构成混合销售或兼营，能否按不同税率拆分计税。

## 技术栈

- 前端：React 18
- 后端：Vercel Serverless Function
- AI 模型：智谱 GLM-4-Flash

## 本地运行

```bash
npm install
npm start
```

## 部署到 Vercel

1. 将本项目推送到 GitHub
2. 在 Vercel 导入该仓库
3. 在 Vercel 项目设置 → Environment Variables 中添加：
   - `ZHIPU_API_KEY` = 你的智谱 API Key
4. 重新部署即可

## 项目结构

```
├── api/
│   └── judge.js          # Vercel Serverless Function（后端）
├── src/
│   ├── index.js          # React 入口
│   └── App.jsx           # 主界面（三栏布局 + 5个演示案例）
├── public/
│   └── index.html
├── package.json
└── vercel.json
```
