from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import AsyncClient


async def get_receive_profile(db: AsyncClient, user_id: str) -> Optional[Dict[str, Any]]:
    result = await db.table("receive_profiles").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def upsert_receive_profile(
    db: AsyncClient,
    user_id: str,
    beexo_alias: str,
    wallet_address: str,
    cvu: Optional[str] = None,
) -> Dict[str, Any]:
    qr_payload = f"beexo://pay?alias={beexo_alias}&address={wallet_address}"
    payload = {
        "user_id": user_id,
        "beexo_alias": beexo_alias,
        "wallet_address": wallet_address,
        "cvu": cvu,
        "qr_payload": qr_payload,
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = await db.table("receive_profiles").upsert(payload).execute()
    return result.data[0]


async def create_swap_transaction(
    db: AsyncClient,
    user_id: str,
    from_token: str,
    to_token: str,
    amount: float,
    quoted_rate: float,
    estimated_received: float,
    tx_hash: Optional[str] = None,
    status: str = "pending",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload = {
        "user_id": user_id,
        "from_token": from_token.upper(),
        "to_token": to_token.upper(),
        "amount": amount,
        "quoted_rate": quoted_rate,
        "estimated_received": estimated_received,
        "tx_hash": tx_hash,
        "status": status,
        "metadata": metadata or {},
    }
    result = await db.table("swap_transactions").insert(payload).execute()
    return result.data[0]


async def create_business_contract(
    db: AsyncClient,
    contract_type: str,
    owner_user_id: str,
    counterparty_address: Optional[str],
    vault_id: Optional[str],
    amount: Optional[float],
    release_date: Optional[datetime],
    guarantee_months: Optional[int],
    on_chain_vault_id: Optional[int],
    summary: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload = {
        "contract_type": contract_type,
        "status": "pending_approval",
        "owner_user_id": owner_user_id,
        "counterparty_address": counterparty_address,
        "vault_id": vault_id,
        "amount": amount,
        "release_date": release_date.isoformat() if release_date else None,
        "guarantee_months": guarantee_months,
        "on_chain_vault_id": on_chain_vault_id,
        "summary": summary,
        "metadata": metadata or {},
    }
    result = await db.table("business_contracts").insert(payload).execute()
    return result.data[0]


async def update_business_contract(
    db: AsyncClient,
    contract_id: str,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    data["updated_at"] = datetime.utcnow().isoformat()
    result = await db.table("business_contracts").update(data).eq("id", contract_id).execute()
    return result.data[0] if result.data else None


async def get_business_contract(db: AsyncClient, contract_id: str) -> Optional[Dict[str, Any]]:
    result = await db.table("business_contracts").select("*").eq("id", contract_id).execute()
    return result.data[0] if result.data else None


async def create_release_rules(
    db: AsyncClient,
    contract_id: str,
    rules: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    payload = []
    for rule in rules:
        payload.append(
            {
                "business_contract_id": contract_id,
                "label": rule["label"],
                "percentage": rule["percentage"],
                "release_day": rule.get("release_day"),
                "target_address": rule.get("target_address"),
                "is_active": True,
            }
        )

    result = await db.table("release_rules").insert(payload).execute()
    return result.data


async def list_contracts_by_user(db: AsyncClient, user_id: str) -> List[Dict[str, Any]]:
    result = await db.table("business_contracts").select("*").eq("owner_user_id", user_id).order("created_at", desc=True).execute()
    return result.data


def estimate_quote(from_token: str, to_token: str, amount: float) -> Dict[str, float]:
    pairs = {
        ("BNB", "BTC"): 0.0074,
        ("DOC", "RBTC"): 0.000025,
        ("RBTC", "DOC"): 40000,
        ("USDRIF", "DOC"): 1.0,
    }
    rate = pairs.get((from_token.upper(), to_token.upper()), 1.0)
    slippage = 0.0035
    received = amount * rate * (1 - slippage)
    return {"rate": rate, "estimated_received": round(received, 8), "slippage": slippage}


def build_motivation_message(current: float, target: float, weekly_extra: float) -> Dict[str, Any]:
    if target <= 0:
        return {
            "message": "Definí un objetivo para recibir recomendaciones.",
            "days_saved": 0,
            "new_eta_days": None,
        }

    remaining = max(target - current, 0)
    base_daily = max(current * 0.0008, 1)  # proxy de progreso diario
    boosted_daily = base_daily + (weekly_extra / 7)

    base_eta = int(remaining / base_daily) if base_daily > 0 else 0
    boosted_eta = int(remaining / boosted_daily) if boosted_daily > 0 else 0
    days_saved = max(base_eta - boosted_eta, 0)

    return {
        "message": f"Si invertís ${weekly_extra:.2f} más esta semana, podés llegar {days_saved} días antes.",
        "days_saved": days_saved,
        "new_eta_days": boosted_eta,
    }


def default_release_date(months: int) -> datetime:
    return datetime.utcnow() + timedelta(days=30 * months)
