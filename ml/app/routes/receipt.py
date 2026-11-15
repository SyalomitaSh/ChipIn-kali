"""Endpoint POST /scan-receipt (lihat docs/api-contract.md)."""
import asyncio
import os
from typing import Optional

from fastapi import APIRouter, File, Header, Query, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.receipt import ErrorResponse, ScanReceiptResponse
from app.services import extraction_service, ocr_service

router = APIRouter()

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {"image/jpeg", "image/png"}
API_KEY = os.getenv("ML_API_KEY")  # kosong = autentikasi dimatikan (mode dev)
ALLOW_MOCK = os.getenv("ML_ALLOW_MOCK", "1") == "1"  # set 0 di production

ERROR_MOCKS = {
    "invalid_file": (400, "INVALID_FILE", "File bukan gambar JPEG/PNG yang valid"),
    "too_large": (413, "FILE_TOO_LARGE", "Ukuran gambar melebihi 5 MB"),
    "unreadable": (422, "RECEIPT_UNREADABLE", "Struk tidak terbaca"),
    "server_error": (500, "INTERNAL_ERROR", "Terjadi kesalahan pada service ML"),
}


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@router.post(
    "/scan-receipt",
    response_model=ScanReceiptResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def scan_receipt(
    image: Optional[UploadFile] = File(None),
    x_api_key: Optional[str] = Header(None),
    mock: Optional[str] = Query(None, description="Skenario dummy: success, needs_review, handwritten, invalid_file, too_large, unreadable, server_error"),
    delay_ms: int = Query(0, ge=0, le=15000, description="Simulasi latency (hanya saat mock)"),
):
    if API_KEY and x_api_key != API_KEY:
        return error(401, "UNAUTHORIZED", "API key tidak valid")

    if mock and ALLOW_MOCK:
        if delay_ms:
            await asyncio.sleep(delay_ms / 1000)
        if mock in ERROR_MOCKS:
            return error(*ERROR_MOCKS[mock])
        scenario = extraction_service.get_scenario(mock)
        if scenario is None:
            return error(400, "UNKNOWN_MOCK", f"mock '{mock}' tidak dikenal")
        return scenario

    if image is None:
        return error(400, "INVALID_FILE", "Field 'image' wajib diisi")
    if image.content_type not in ALLOWED_TYPES:
        return error(400, "INVALID_FILE", "File harus berupa gambar JPEG atau PNG")
    data = await image.read()
    if len(data) > MAX_BYTES:
        return error(413, "FILE_TOO_LARGE", "Ukuran gambar melebihi 5 MB")

    lines = ocr_service.predict(data)
    return extraction_service.extract(lines)
