import asyncio

from moss_service import load_indexes, retrieve_evidence


QUERIES = [
    "How long is a password reset link valid?",
    "Can I return electronics after 20 days?",
    "How much baggage can I take on an economy flight?",
    "Can I share a confidential company document externally?",
    "When does the exam start?",
]


async def main():

    await load_indexes()

    print("\n" + "=" * 60)
    print("        MOSS RETRIEVAL TEST")
    print("=" * 60)

    for q in QUERIES:

        docs = await retrieve_evidence(q, top_k=3)

        print("\n" + "-" * 60)
        print(f"QUERY: {q}")

        for doc in docs:
            print(f"[{doc.id}] {doc.text}")


if __name__ == "__main__":
    asyncio.run(main())