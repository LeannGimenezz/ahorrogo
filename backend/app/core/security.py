from web3 import Web3
from eth_account.messages import encode_defunct
from app.config import get_settings

settings = get_settings()

AUTH_MESSAGE = "Sign this to authenticate with AhorroGO"

w3 = Web3(Web3.HTTPProvider(settings.rsk_rpc_url))


def verify_beexo_signature(address: str, signature: str, message: str = AUTH_MESSAGE) -> bool:
    try:
        signable_message = encode_defunct(text=message)
        recovered = w3.eth.account.recover_message(
            signable_message,
            signature=signature
        )
        return recovered.lower() == address.lower()
    except Exception:
        return False


def is_valid_address(address: str) -> bool:
    return Web3.is_address(address)


def get_address_checksum(address: str) -> str:
    return Web3.to_checksum_address(address)
