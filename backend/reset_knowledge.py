import asyncio

from moss_service import moss, load_indexes
from knowledge_loader import build_documents


async def main():

    print("=" * 60)
    print("       AGENTSHIELD KNOWLEDGE BASE RESET")
    print("=" * 60)

    # Load existing indexes
    await load_indexes()

    # --------------------------------------------------------
    # 1. Get all existing FAQ documents
    # --------------------------------------------------------

    existing_docs = await moss.get_docs("faq")

    print(
        f"\nExisting FAQ documents: {len(existing_docs)}"
    )

    # --------------------------------------------------------
    # 2. Delete all existing FAQ documents
    # --------------------------------------------------------

    if existing_docs:

        ids = [
            doc.id
            for doc in existing_docs
        ]

        await moss.delete_docs(
            "faq",
            ids
        )

        print(
            f"Deleted {len(ids)} old FAQ documents."
        )

    else:
        print("FAQ index is already empty.")

    # --------------------------------------------------------
    # 3. Rebuild clean knowledge base
    # --------------------------------------------------------

    documents = build_documents()

    print(
        f"\nLoading clean knowledge base: "
        f"{len(documents)} documents..."
    )

    # Add clean documents
    from moss import MutationOptions

    await moss.add_docs(
        "faq",
        documents,
        MutationOptions(upsert=True)
    )

    print(
        "\n✅ Knowledge base reset successfully."
    )

    # --------------------------------------------------------
    # 4. Verify
    # --------------------------------------------------------

    final_docs = await moss.get_docs("faq")

    print(
        f"Final FAQ document count: "
        f"{len(final_docs)}"
    )


if __name__ == "__main__":
    asyncio.run(main())