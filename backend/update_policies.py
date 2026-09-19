import asyncio

from moss_service import load_indexes, update_policies


async def main():
    await load_indexes()
    await update_policies()


if __name__ == "__main__":
    asyncio.run(main())