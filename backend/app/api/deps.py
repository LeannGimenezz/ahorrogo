from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import AsyncClient
from app.database import get_supabase_client
from app.core.auth import decode_token
from app.services import user_service

security = HTTPBearer()


async def get_db() -> AsyncClient:
    return await get_supabase_client()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncClient = Depends(get_db)
) -> Dict[str, Any]:
    token = credentials.credentials
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    address = payload.get("sub")
    if not address:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user = await user_service.get_by_address(db, address)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncClient = Depends(get_db)
) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    
    address = payload.get("sub")
    if not address:
        return None
    
    return await user_service.get_by_address(db, address)
