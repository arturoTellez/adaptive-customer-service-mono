import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar si la contraseña coincide con el hash"""
    password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return password_hash == hashed_password

def get_password_hash(password: str) -> str:
    """Hashear una contraseña con SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()