from fastapi import FastAPI

from app.routes import receipt
from app.services.extraction_service import MODEL_VERSION

app = FastAPI(title="ChipIn ML Service", version=MODEL_VERSION)
app.include_router(receipt.router)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "stub", "model_version": MODEL_VERSION}
