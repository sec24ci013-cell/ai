import asyncio
import traceback
from app.database import init_db

async def main():
    print("Attempting to initialize database...")
    try:
        await init_db()
        print("DB Init OK")
    except Exception as e:
        print(f"DB Init Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
