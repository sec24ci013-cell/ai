import asyncio
import traceback
import sys

print(f"Python: {sys.version}")
print("Testing imports...")

try:
    from app.config import settings
    print(f"[OK] config - Project: {settings.PROJECT_NAME}")
except Exception as e:
    print(f"[FAIL] config: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.database import init_db
    print("[OK] database module")
except Exception as e:
    print(f"[FAIL] database: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.middleware.audit import AuditMiddleware
    print("[OK] audit middleware")
except Exception as e:
    print(f"[FAIL] audit middleware: {e}")
    traceback.print_exc()

try:
    from app.routes import auth
    print("[OK] auth route")
except Exception as e:
    print(f"[FAIL] auth route: {e}")
    traceback.print_exc()

try:
    from app.routes import ai_routes
    print("[OK] ai_routes")
except Exception as e:
    print(f"[FAIL] ai_routes: {e}")
    traceback.print_exc()

try:
    from app.routes import graph
    print("[OK] graph route")
except Exception as e:
    print(f"[FAIL] graph route: {e}")
    traceback.print_exc()

try:
    from app.routes import voice
    print("[OK] voice route")
except Exception as e:
    print(f"[FAIL] voice route: {e}")
    traceback.print_exc()

try:
    from app.routes import cctv
    print("[OK] cctv route")
except Exception as e:
    print(f"[FAIL] cctv route: {e}")
    traceback.print_exc()

try:
    from app.routes import dashboard
    print("[OK] dashboard route")
except Exception as e:
    print(f"[FAIL] dashboard route: {e}")
    traceback.print_exc()

try:
    from app.routes import reports
    print("[OK] reports route")
except Exception as e:
    print(f"[FAIL] reports route: {e}")
    traceback.print_exc()

print("\nAll checks done.")
