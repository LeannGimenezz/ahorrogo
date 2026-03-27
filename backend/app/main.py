from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.api.v1.router import api_router

settings = get_settings()

app = FastAPI(
    title="AhorroGO API",
    description="Backend API for AhorroGO - Gamified Savings on Bitcoin",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) if settings.app_env == "development" else "Internal server error"},
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app_env": settings.app_env}


app.include_router(api_router, prefix="/api/v1")
