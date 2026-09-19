import asyncio

from moss_service import load_indexes
from chat import start_chat


async def main():
    print("=" * 60)
    print("        AGENTSHIELD — AI RELIABILITY LAYER")
    print("=" * 60)

    await load_indexes()
    await start_chat()


if __name__ == "__main__":
    asyncio.run(main())