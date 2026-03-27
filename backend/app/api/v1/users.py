from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from app.api.deps import get_db, get_current_user
from app.services import user_service
from app.services.vault_service import vault_service
from app.services.tropykus_service import tropykus_service
from app.models.schemas import (
    UserResponse,
    UserByAddressResponse,
    AuthVerifyRequest,
    AuthVerifyResponse,
    UserBalanceResponse,
)
from app.core.security import verify_beexo_signature
from app.core.auth import create_access_token

router = APIRouter()


@router.post("/verify", response_model=AuthVerifyResponse)
async def verify_auth(request: AuthVerifyRequest, db: AsyncClient = Depends(get_db)):
    if not verify_beexo_signature(request.address, request.signature, request.message):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature",
        )
    
    alias = f"{request.address[:8]}.bexo"
    user = await user_service.get_or_create(db, request.address.lower(), alias)
    
    token = create_access_token({"sub": user["address"]})
    
    user_response = UserResponse(
        id=user["id"],
        address=user["address"],
        alias=user["alias"],
        xp=user["xp"],
        level=user["level"],
        streak=user["streak"],
        last_deposit_at=user.get("last_deposit_at"),
        created_at=user["created_at"],
    )
    
    return AuthVerifyResponse(user=user_response, token=token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        address=current_user["address"],
        alias=current_user["alias"],
        xp=current_user["xp"],
        level=current_user["level"],
        streak=current_user["streak"],
        last_deposit_at=current_user.get("last_deposit_at"),
        created_at=current_user["created_at"],
    )


@router.get("/{address}", response_model=UserByAddressResponse)
async def get_user_by_address(
    address: str,
    db: AsyncClient = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user = await user_service.get_by_address(db, address.lower())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    has_guarantee = await user_service.has_active_guarantee(db, address.lower())
    
    return UserByAddressResponse(
        address=user["address"],
        alias=user["alias"],
        has_active_guarantee=has_guarantee,
    )


@router.get("/me/balance", response_model=UserBalanceResponse)
async def get_user_balance(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    """
    Get the user's total balance across all vaults.
    
    Returns:
        - total: Sum of all vault balances
        - available: Sum of vaults without locks or with expired locks
        - locked: Sum of vaults with locks that haven't expired
        - yield_this_month: Estimated yield from Topykus APY
        - yield_percentage: Current APY from Topykus
    """
    vaults = await vault_service.get_by_user(db, current_user["id"])
    
    total = 0.0
    available = 0.0
    locked = 0.0
    
    for vault in vaults:
        total += vault["current"]
        
        if vault.get("locked") and vault.get("unlock_date"):
            unlock_date = vault["unlock_date"]
            if isinstance(unlock_date, str):
                unlock_date = datetime.fromisoformat(unlock_date.replace("Z", "+00:00"))
            
            if datetime.utcnow() < unlock_date:
                locked += vault["current"]
            else:
                available += vault["current"]
        else:
            available += vault["current"]
    
    # Get APY from Topykus
    try:
        market_info = tropykus_service.get_market_info("krbtc")
        yield_percentage = market_info.supply_rate
    except Exception:
        yield_percentage = 0.052  # Fallback ~5.2% APY
    
    # Estimate monthly yield
    days_in_month = 30
    yield_this_month = total * (yield_percentage * days_in_month / 365)
    
    return UserBalanceResponse(
        total=round(total, 2),
        available=round(available, 2),
        locked=round(locked, 2),
        yield_this_month=round(yield_this_month, 2),
        yield_percentage=yield_percentage,
    )
