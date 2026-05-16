"""
auth_router.py — JWT authentication with bcrypt password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
import models

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Config ──────────────────────────────────────────────
SECRET_KEY = "stocksense-ai-super-secret-key-2024-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ── Schemas ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Helpers ──────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    payload = data.copy()
    if "exp" not in payload:
        payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def send_reset_email(to_email: str, token: str):
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.ethereal.email")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ETHEREAL_WEB = os.getenv("ETHEREAL_WEB", "")

    if not SMTP_USER or not SMTP_PASSWORD:
        print("ERROR: SMTP credentials not configured in .env", flush=True)
        return

    try:
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

        msg = MIMEMultipart("alternative")
        msg["From"] = f"StockSense AI <{SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = "Reset Your StockSense AI Password"

        html = f"""
        <html>
          <body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
              <tr><td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4e;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">StockSense <span style="opacity:.8">AI</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;">Password Reset Request</h2>
                      <p style="margin:0 0 24px;color:#94a3b8;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong style="color:#f1f5f9;">15 minutes</strong>.</p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="{reset_link}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Reset My Password</a>
                      </div>
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this URL into your browser:</p>
                      <p style="margin:0;word-break:break-all;"><a href="{reset_link}" style="color:#6366f1;font-size:13px;">{reset_link}</a></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #2d2d4e;">
                      <p style="margin:0;color:#475569;font-size:12px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))

        # Always log locally first (before SMTP attempt)
        with open("sent_emails.log", "a", encoding="utf-8") as f:
            f.write(f"--- EMAIL TO: {to_email} ---\n")
            f.write(f"LINK: {reset_link}\n")
            if ETHEREAL_WEB:
                f.write(f"VIEW AT: {ETHEREAL_WEB}/login\n")
            f.write("-----------------------------\n\n")

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"[OK] Password reset email sent to {to_email}", flush=True)
        if ETHEREAL_WEB:
            print(f"[INBOX] View at: {ETHEREAL_WEB}/login  (user: {SMTP_USER})", flush=True)

    except Exception as e:
        print(f"[ERROR] Failed to send email to {to_email}: {e}", flush=True)



def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    return user


# ── Routes ──────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Register request received for email: {req.email}")
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please sign in.")

    user = models.User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name or req.email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    
    # ── AUTO-REGISTRATION LOGIC ──
    if not user:
        # If user doesn't exist, create them instantly (Any email works)
        user = models.User(
            email=req.email,
            password_hash=hash_password(req.password),
            name=req.email.split("@")[0].title(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # If user exists, verify password
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password for this account.")

    token = create_token({"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@router.get("/me")
def get_me(current_user: Optional[models.User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Return same message to prevent email enumeration
        return {"message": "If an account exists, a reset link has been sent."}
    
    payload = {"user_id": user.id, "email": user.email, "type": "reset"}
    payload["exp"] = datetime.utcnow() + timedelta(minutes=15)
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    background_tasks.add_task(send_reset_email, user.email, token)
    print(f"[DEV] Reset link for {user.email}: {reset_link}", flush=True)
    return {
        "message": "If an account exists, a reset link has been sent.",
        "reset_link": reset_link,  # Returned for dev convenience — remove in production
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type.")
        user_id = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")
        
    user.password_hash = hash_password(req.new_password)
    db.commit()
    
    return {"message": "Password has been successfully reset."}
