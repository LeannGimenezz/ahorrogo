from fastapi import APIRouter
from app.api.v1 import users, vaults, penguin, transfers, webhooks, notifications, blockchain, business

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(vaults.router, prefix="/vaults", tags=["vaults"])
api_router.include_router(penguin.router, prefix="/penguin", tags=["penguin"])
api_router.include_router(transfers.router, prefix="/transfers", tags=["transfers"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["blockchain"])
api_router.include_router(business.router, tags=["business"])
