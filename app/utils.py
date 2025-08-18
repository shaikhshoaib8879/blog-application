import base64
import hmac
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
import pdb  # For debugging purposes, can be removed in production


def _sign(data: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), data, hashlib.sha256).hexdigest()


def _b64(s: bytes) -> str:
    return base64.urlsafe_b64encode(s).decode().rstrip('=')


def _unb64(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def create_timed_token(payload: dict, secret: str, expires_in_seconds: int = 3600) -> str:
    now = int(datetime.now(timezone.utc).timestamp())
    exp = now + expires_in_seconds
    body = {**payload, 'iat': now, 'exp': exp}
    raw = json.dumps(body, separators=(',', ':'), sort_keys=True).encode()
    sig = _sign(raw, secret)
    return _b64(raw) + '.' + sig


def verify_timed_token(token: str, secret: str) -> dict | None:
    try:
        raw_b64, sig = token.split('.', 1)
        raw = _unb64(raw_b64)
        expected = _sign(raw, secret)
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(raw)
        now = int(datetime.now(timezone.utc).timestamp())
        if 'exp' in data and now > int(data['exp']):
            return None
        return data
    except Exception:
        return None


def send_email(to_email: str, subject: str, body: str) -> None:
    """Send email via SMTP. Supports Gmail if SMTP_* envs provided.
    Env:
      SMTP_HOST (e.g., smtp.gmail.com)
      SMTP_PORT (e.g., 587)
      SMTP_USER (full email)
      SMTP_PASSWORD (app password)
      SMTP_USE_TLS ("1" to enable)
      FROM_EMAIL (optional display from)
    Fallback: print to console.
    """
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_use_tls = os.environ.get('SMTP_USE_TLS', '1') == '1'
    from_email = os.environ.get('FROM_EMAIL', smtp_user or 'no-reply@example.com')
    if not smtp_host or not smtp_user or not smtp_password:
        print(f"[EMAIL:console] To: {to_email}\nSubject: {subject}\n\n{body}\n")
        return

    import smtplib
    from email.mime.text import MIMEText
    from email.utils import formataddr

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr(('Blog App', from_email))
    msg['To'] = to_email

    server = None
    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        if smtp_use_tls:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_email, [to_email], msg.as_string())
        print(f"[EMAIL:sent] to {to_email}")
    except Exception as e:
        print(f"[EMAIL:error] {e}. Falling back to console.\nTo: {to_email}\nSubject: {subject}\n\n{body}\n")
    finally:
        try:
            if server:
                server.quit()
        except Exception:
            pass
