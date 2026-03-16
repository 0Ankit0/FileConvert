from fastapi import FastAPI

from app.api.conversions import router as conversions_router

app = FastAPI(title="FileConvert API")
app.include_router(conversions_router)
