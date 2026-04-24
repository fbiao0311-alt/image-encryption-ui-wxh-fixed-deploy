import os
from pathlib import Path
import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from task1_randomness import (
    analyze_randomness_from_text,
    analyze_uploaded_bitstream,
)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI()

allowed_origins = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]

# 默认允许 Vercel 生成的前端域名访问后端。
# 如果你绑定了自己的域名，仍然建议在 Render 里设置 ALLOWED_ORIGINS。
allowed_origin_regex = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"https://.*\\.vercel\\.app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(OUTPUT_DIR)), name="static")


class RandomnessRequest(BaseModel):
    bitstream_text: str


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.post("/api/task1/randomness/analyze")
def analyze_randomness(request: RandomnessRequest):
    return analyze_randomness_from_text(request.bitstream_text)


@app.post("/api/task1/randomness/analyze-file")
async def analyze_randomness_file(bitstream_file: UploadFile = File(...)):
    if not bitstream_file.filename:
        raise HTTPException(status_code=400, detail="没有接收到文件")

    if Path(bitstream_file.filename).suffix.lower() != ".txt":
        raise HTTPException(status_code=400, detail="请上传 .txt 文件")

    save_name = f"{uuid.uuid4().hex}_{Path(bitstream_file.filename).name}"
    save_path = UPLOAD_DIR / save_name

    content = await bitstream_file.read()
    save_path.write_bytes(content)

    result = analyze_uploaded_bitstream(str(save_path))

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result
