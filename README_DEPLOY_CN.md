# 部署和验证说明

这个项目是前后端分离：

- 前端：React + Vite，部署到 Vercel
- 后端：FastAPI，部署到 Render

## 1. Render 后端设置

Root Directory：

```text
backend
```

Build Command：

```text
pip install -r requirements.txt
```

Start Command：

```text
uvicorn main:app --host 0.0.0.0 --port $PORT
```

建议在 Render 的 Environment 里添加：

```text
ALLOWED_ORIGINS=https://你的-vercel-前端网址.vercel.app
```

部署完成后，打开 Render 后端首页，应该看到：

```json
{"message":"Backend is running"}
```

## 2. Vercel 前端设置

Framework Preset：

```text
Vite
```

Build Command：

```text
npm run build
```

Output Directory：

```text
dist
```

必须在 Vercel 的 Environment Variables 里添加：

```text
VITE_API_BASE_URL=https://你的-render-后端网址.onrender.com
```

注意：后端网址末尾不要加 `/`。

## 3. 为什么任务二能上传，不代表任务一能上传

任务二的文件读取主要在浏览器本地完成，不需要真正上传到 Render 后端。

任务一会调用 FastAPI 接口：

```text
POST /api/task1/randomness/analyze-file
```

字段名必须是：

```text
bitstream_file
```

所以任务一更容易暴露这些问题：

- Vercel 没有配置 `VITE_API_BASE_URL`
- Render 没有配置 `ALLOWED_ORIGINS`
- 上传的不是 `.txt` 文件
- 后端没有成功启动
- 后端处理大文件超时

## 4. 浏览器验证方法

打开 Vercel 页面后，按 F12，进入 Network，然后执行任务一上传。

正确情况：

```text
Request URL = https://你的-render-后端网址.onrender.com/api/task1/randomness/analyze-file
Status Code = 200
```

错误排查：

```text
请求 127.0.0.1 / localhost：VITE_API_BASE_URL 没配好
CORS 报错：Render 的 ALLOWED_ORIGINS 没配好
400：文件不是 .txt，或 txt 里没有 0/1 比特流
422：前后端上传字段名不一致
500：后端任务一处理逻辑报错
```
