from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import UserCreate, UserOut, Token, UserUpdate
from app.utils.security import get_password_hash, verify_password, create_access_token, get_current_user, get_admin_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate):
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already exists in the system.")
    # Auto-promote specific supervisor accounts
    role = user_in.role
    if user_in.email in ["rp@gmail.com", "rp1@gmail.com"]:
        role = "admin"
    user = User(
        name=user_in.name, email=user_in.email,
        password_hash=get_password_hash(user_in.password), role=role
    )
    await user.insert()
    return user


@router.post("/seed-supervisor")
async def seed_supervisor():
    """Create the default supervisor accounts if they don't exist."""
    results = []
    supervisors = [
        {"name": "RP Supervisor", "email": "rp@gmail.com", "password": "admin123"},
        {"name": "RP1 Supervisor", "email": "rp1@gmail.com", "password": "rohit123"},
    ]
    for sup in supervisors:
        existing = await User.find_one(User.email == sup["email"])
        if existing:
            existing.role = "admin"
            existing.password_hash = get_password_hash(sup["password"])
            await existing.save()
            results.append({"email": sup["email"], "status": "updated", "role": "admin"})
        else:
            user = User(
                name=sup["name"],
                email=sup["email"],
                password_hash=get_password_hash(sup["password"]),
                role="admin"
            )
            await user.insert()
            results.append({"email": sup["email"], "status": "created", "role": "admin", "password": sup["password"]})
    return {"message": "Supervisor accounts ready", "accounts": results}


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # MFA check
    if user.mfa_enabled:
        from app.services.mfa_service import verify_totp
        mfa_code = form_data.scopes[0] if form_data.scopes else None
        if not mfa_code:
            raise HTTPException(status_code=202, detail="MFA_REQUIRED")
        if not verify_totp(user.mfa_secret, mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code.")

    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully", "note": "Please discard your JWT token on the client side."}


# --- User Management (Admin Only) ---

@router.get("/users", response_model=list[UserOut])
async def list_users(current_user: User = Depends(get_admin_user)):
    return await User.find_all().to_list()

@router.put("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(user_id: str, user_in: UserUpdate, current_user: User = Depends(get_admin_user)):
    from beanie import PydanticObjectId
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = user_in.role
    await user.save()
    return user


# --- MFA Endpoints ---

class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str

class MFAVerifyRequest(BaseModel):
    code: str


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(current_user: User = Depends(get_current_user)):
    from app.services.mfa_service import generate_mfa_secret, generate_qr_code
    secret = generate_mfa_secret()
    qr = generate_qr_code(current_user.email, secret)
    current_user.mfa_secret = secret
    await current_user.save()
    return MFASetupResponse(secret=secret, qr_code=qr)


@router.post("/mfa/verify")
async def verify_mfa_setup(req: MFAVerifyRequest, current_user: User = Depends(get_current_user)):
    from app.services.mfa_service import verify_totp
    if not current_user.mfa_secret:
        raise HTTPException(400, "MFA setup not started. Call /mfa/setup first.")
    if not verify_totp(current_user.mfa_secret, req.code):
        raise HTTPException(400, "Invalid code.")
    current_user.mfa_enabled = True
    await current_user.save()
    return {"message": "MFA enabled successfully."}


@router.post("/mfa/disable")
async def disable_mfa(req: MFAVerifyRequest, current_user: User = Depends(get_current_user)):
    from app.services.mfa_service import verify_totp
    if not current_user.mfa_enabled:
        raise HTTPException(400, "MFA is not enabled.")
    if not verify_totp(current_user.mfa_secret, req.code):
        raise HTTPException(400, "Invalid code.")
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    await current_user.save()
    return {"message": "MFA disabled."}


# --- Audit Logs ---

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 50, current_user: User = Depends(get_current_user)):
    logs = await AuditLog.find_all().sort("-timestamp").limit(limit).to_list()
    return logs
