"""Schema request/response. Sumber kebenaran: docs/api-contract.md."""
from typing import List, Optional

from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    name: str
    qty: int
    unit_price: int  # rupiah, integer
    total_price: int  # rupiah, integer
    category: str
    confidence: float = Field(ge=0, le=1)


class ScanReceiptResponse(BaseModel):
    model_version: str
    merchant: Optional[str] = None
    items: List[ReceiptItem]
    subtotal: int
    tax: int
    service_charge: int
    discount: int
    total: int
    needs_review: bool  # true jika item + pajak + service - diskon != total, atau confidence rendah


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
