# Deployment Guide

This project contains:

- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)

To make it publicly accessible, deploy the frontend and backend separately.

## Recommended setup

- Deploy **frontend** to **Vercel**
- Deploy **backend** to **Render**

---

## 1) Deploy backend to Render

Backend directory:

```
image-encryption-ui/backend
```

### Render settings

- **Runtime**: Python
- **Root Directory**: `image-encryption-ui/backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

After deploy, Render will give you a backend URL like:

```
https://your-backend.onrender.com
```

Set environment variable on Render:

- `ALLOWED_ORIGINS=https://your-frontend.vercel.app`

If you later bind a custom domain, add it too:

- `ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://yourdomain.com`

---

## 2) Deploy frontend to Vercel

Frontend directory:

```
image-encryption-ui
```

### Vercel settings

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

Set environment variable on Vercel:

- `VITE_API_BASE_URL=https://your-backend.onrender.com`

Then redeploy the frontend.

---

## 3) Local development

### Backend

```bash
cd image-encryption-ui/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```bash
cd image-encryption-ui
npm install
npm run dev
```

If you do not set `VITE_API_BASE_URL`, the frontend defaults to:

```
http://127.0.0.1:8001
```

---

## Why GitHub Pages is not enough

GitHub Pages can host the frontend static files, but it cannot run the Python backend.
Because Task 1 uploads files and calls FastAPI endpoints, this project needs a backend hosting service.

---

## Important code changes already made

- Removed hardcoded frontend API dependency on `127.0.0.1:8001`
- Added `VITE_API_BASE_URL` support
- Added backend `ALLOWED_ORIGINS` environment variable support
- Added backend `requirements.txt` for deployment
