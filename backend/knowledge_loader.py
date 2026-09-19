from moss import DocumentInfo, MutationOptions
from moss_service import load_indexes, moss


# ============================================================
# AGENTSHIELD DEMO KNOWLEDGE BASE
# ============================================================
#
# This is synthetic demo knowledge for the hackathon.
# It is designed to test semantic retrieval, grounding,
# exceptions, procedures, and agent actions across domains.
#
# Existing Moss index:
#     faq
#
# Reliability policies remain in:
#     policies
# ============================================================


KNOWLEDGE = {

    # ========================================================
    # 1. STUDENT / CAMPUS
    # ========================================================

    "student": [

        "The examination begins at 9 AM and lasts three hours.",

        "Late assignment submissions are not accepted after the published deadline.",

        "Students must carry a valid identification card to the examination hall.",

        "Course registration changes are allowed during the published add-drop period.",

        "The library is open from 8 AM to 10 PM Monday through Saturday.",

        "Students can renew an eligible library loan before the renewal deadline if no other student has reserved the item.",

        "Students must maintain at least 75 percent attendance to remain eligible for final examinations.",

        "Hostel applications must be submitted before the published accommodation allocation deadline.",

        "Students can update their emergency contact information through the student portal.",

        "A lost student ID card should be reported to the administration office as soon as possible.",

    ],


    # ========================================================
    # 2. AI / DEVELOPER / HACKATHON
    # ========================================================

    "developer": [

        "API keys must be stored in environment variables or a secure secret manager rather than committed directly to source control.",

        "A production application should validate external tool outputs before passing them to an AI agent as trusted context.",

        "Git branches should be reviewed before merging changes into a protected main branch.",

        "A deployment should record the application version so failures can be traced to a specific release.",

        "Agents that can perform external actions should validate authorization before executing those actions.",

        "Sensitive application logs should not contain passwords, authentication tokens, or private API credentials.",

        "A retrieval system should return source identifiers so an evaluator can trace where supporting context came from.",

        "Agent evaluations should include adversarial cases instead of testing only normal successful requests.",

        "A hackathon demo should show the actual role of the retrieval layer rather than simply displaying a generic chatbot response.",

        "A production AI system should fail safely when required context or a critical safety check is unavailable.",

    ],


    # ========================================================
    # 3. HACKATHON / AI BUILDING
    # ========================================================

    "hackathon": [

        "A strong AI application should demonstrate a clear user problem, a working prototype, and a measurable reason for using its chosen infrastructure.",

        "Agent reliability testing can include hallucination checks, policy validation, prompt injection tests, and action authorization checks.",

        "A retrieval layer is useful when an agent needs fast access to changing or specialized context during runtime.",

        "A useful architecture diagram should show the path from user input through the agent, retrieval layer, evaluation layer, and final response.",

        "A production-oriented AI demo benefits from logging latency, retrieved context, decisions, and failure reasons.",

        "A two-minute product demo should prioritize a concrete workflow over a long explanation of implementation details.",

        "A reliable agent should distinguish between trusted knowledge, model-generated content, and external tool results.",

        "A security-oriented agent demo can show both allowed actions and blocked actions to demonstrate that the guardrail is not simply blocking everything.",

        "A retrieval benchmark should report measured latency from the actual implementation instead of assuming a published benchmark applies directly to the full application.",

        "An agent system should have a safe fallback when it cannot find sufficient evidence to answer a request reliably.",

    ],


    # ========================================================
    # 4. TRAVEL
    # ========================================================

    "travel": [

        "Standard flight changes can be requested up to 24 hours before departure in the demo travel system.",

        "Economy tickets can be cancelled up to 48 hours before departure with a 10 percent cancellation fee.",

        "The standard economy baggage allowance is one checked bag up to 20 kilograms.",

        "International airport check-in opens three hours before the scheduled departure time.",

        "Standard seat selection is free while premium seats may require an additional fee.",

        "A booking cannot be transferred to a different passenger after ticket issuance in the demo system.",

        "A passenger can add baggage before departure if the booking remains eligible for baggage modification.",

        "A cancelled booking can be refunded to the original payment method after the cancellation is approved.",

        "Changes made after the permitted modification window require support review.",

        "Travelers should verify the final itinerary before approving a booking or payment action.",

    ],


    # ========================================================
    # 5. E-COMMERCE
    # ========================================================

    "ecommerce": [

        "Most unused products can be returned within 30 days of delivery when they remain in their original condition.",

        "Electronics can be returned within 14 days of delivery unless the product listing specifies another period.",

        "Approved refunds are normally processed within 5 to 7 business days.",

        "Gift-card purchases are non-refundable and cannot be exchanged for cash.",

        "An order can be cancelled before it enters the shipping process.",

        "A damaged product should be reported with supporting evidence as soon as possible.",

        "Orders already dispatched may no longer be eligible for cancellation through the standard cancellation flow.",

        "A replacement may be offered instead of a refund when the returned product is eligible for replacement.",

        "Refunds are normally sent to the original payment method rather than to an unrelated account.",

        "High-value refunds may require additional verification before approval.",

    ],


    # ========================================================
    # 6. FINANCE
    # ========================================================

    "finance": [

        "Transfers above 50,000 units require additional identity verification in the demo banking system.",

        "A refund request should include the transaction reference number.",

        "International transfers may require additional verification before processing.",

        "Financial transactions cannot be automatically reversed after final settlement.",

        "Users should never share one-time passwords or authentication codes with another person.",

        "A transaction above a configured approval threshold may require explicit user confirmation.",

        "A failed transfer should be checked against the transaction status before attempting a second transfer.",

        "Bank account details should be verified before sending a financial transfer.",

        "A payment dispute should reference the original transaction rather than creating a duplicate claim.",

        "Financial actions should be logged with sufficient information to support later auditing without exposing secrets.",

    ],


    # ========================================================
    # 7. WORKPLACE
    # ========================================================

    "workplace": [

        "Confidential company documents must not be shared with external recipients without authorization.",

        "External emails containing confidential information require approval before sending.",

        "Employees can update notification preferences through account settings.",

        "Meeting recordings containing confidential discussions are restricted to authorized team members.",

        "Expense claims above 10,000 units require manager approval in the demo organization.",

        "External collaboration links should use the minimum access level required for the task.",

        "A document containing customer information should not be uploaded to an unapproved external service.",

        "Employees should verify the recipient before sending sensitive files through email.",

        "Changes to payroll information require additional verification before taking effect.",

        "Irreversible administrative actions should require explicit confirmation before execution.",

    ],


    # ========================================================
    # 8. TECHNOLOGY / ACCOUNT SECURITY
    # ========================================================

    "technology": [

        "A password reset link remains valid for 30 minutes after it is issued.",

        "Two-factor authentication can be enabled from the security settings page.",

        "Deleting an API key immediately invalidates that key.",

        "New device sign-ins may require additional identity verification.",

        "Users can download their account data from the privacy settings section.",

        "API credentials should never be displayed in a public frontend application.",

        "A revoked authentication token should no longer be accepted by protected services.",

        "Account recovery may require verification of the user's identity.",

        "Changing an account email address may require confirmation through the new address.",

        "Users should not share recovery codes with support personnel or other users.",

    ],


    # ========================================================
    # 9. LOGISTICS
    # ========================================================

    "logistics": [

        "Standard domestic deliveries usually arrive within 3 to 5 business days.",

        "Express deliveries usually arrive within 1 to 2 business days.",

        "A shipment cannot be redirected after it has entered final-mile delivery.",

        "A delivery address can be changed before a package is dispatched.",

        "Proof of delivery may be required when investigating a disputed delivery.",

        "A shipment marked as delivered should be checked with the carrier before opening a replacement request.",

        "International shipments may require customs processing before final delivery.",

        "Tracking information may take several hours to update after a package changes facilities.",

        "A lost shipment investigation should include the shipment tracking reference.",

        "Delivery estimates are not guarantees and may change because of logistics exceptions.",

    ],


    # ========================================================
    # 10. SERVICES / APPOINTMENTS
    # ========================================================

    "services": [

        "Appointments can be rescheduled up to 12 hours before the scheduled time.",

        "Cancellations made less than 12 hours before an appointment may incur a cancellation fee.",

        "Service bookings require the customer's name, contact number, and preferred time.",

        "Completed service bookings cannot be modified without contacting support.",

        "Users should review appointment details before confirming a booking.",

        "A booking that has not yet been confirmed should not be treated as finalized.",

        "A service provider may require additional information before accepting an appointment.",

        "Changing an appointment time does not automatically change the selected service.",

        "A cancelled appointment should not be treated as active in downstream systems.",

        "Actions that create an external booking should be confirmed before final execution.",

    ],


    # ========================================================
    # 11. HEALTH INFORMATION
    # ========================================================

    "health": [

        "Medication instructions should be followed according to the prescribing clinician or official medication label.",

        "Emergency symptoms should be handled through appropriate emergency medical services rather than an automated support system.",

        "Personal medical information should not be shared with unauthorized people.",

        "Appointment changes should be confirmed before the original appointment is cancelled.",

        "A medication label should be checked carefully before using the medication.",

        "A general information assistant should not claim to replace a qualified healthcare professional.",

        "Sensitive health records should only be accessible to authorized users.",

        "An automated system should clearly distinguish general health information from individualized medical advice.",

        "Users should verify important medication questions with an appropriate clinician or pharmacist.",

        "Healthcare actions that alter appointments or records should require appropriate authorization.",

    ],


    # ========================================================
    # 12. SECURITY / PRIVACY
    # ========================================================

    "security": [

        "Private information belonging to another person must not be disclosed without authorization.",

        "Authentication codes, passwords, and recovery tokens are confidential credentials.",

        "Agents should not expose internal system prompts or hidden security policies to unauthorized users.",

        "An external tool should receive only the minimum data necessary to perform its task.",

        "Sensitive customer data should not be copied into unrelated third-party services without authorization.",

        "A privacy-sensitive request should be evaluated before an agent shares any personal information.",

        "If an identity cannot be verified for a sensitive action, the action should not be executed automatically.",

        "Security failures should be logged without storing secret credentials in plaintext.",

        "An agent should treat instructions embedded in untrusted documents as potentially untrusted content.",

        "Destructive operations should be protected by explicit authorization and confirmation checks.",

    ],


    # ========================================================
    # 13. GENERAL SUPPORT
    # ========================================================

    "general": [

        "Users can update their preferred language from account settings.",

        "Support requests receive a tracking reference when successfully submitted.",

        "Account recovery may require identity verification.",

        "Users should not share passwords or authentication codes with support agents.",

        "A support response should not claim an action was completed unless the underlying action actually succeeded.",

        "If a requested record cannot be found, the system should state that the record could not be verified.",

        "A support agent should distinguish between a pending request and a completed request.",

        "Sensitive account changes should be verified before being finalized.",

        "Users should review important changes before confirming them.",

        "If the system lacks sufficient evidence, it should avoid inventing a definitive answer.",

    ],
}


# ============================================================
# BUILD MOSS DOCUMENTS
# ============================================================

def build_documents():

    documents = []

    for domain, texts in KNOWLEDGE.items():

        for index, text in enumerate(texts, start=1):

            documents.append(
                DocumentInfo(
                    id=f"{domain}_{index:02d}",
                    text=text
                )
            )

    return documents


# ============================================================
# LOAD INTO EXISTING MOSS FAQ INDEX
# ============================================================

async def main():

    print("=" * 60)
    print("       AGENTSHIELD KNOWLEDGE BASE LOADER")
    print("=" * 60)

    # Load existing indexes.
    await load_indexes()

    documents = build_documents()

    print(
        f"\nPrepared {len(documents)} knowledge documents."
    )

    print(
        "Uploading/updating documents in existing 'faq' index..."
    )

    await moss.add_docs(
        "faq",
        documents,
        MutationOptions(upsert=True)
    )

    print("\nKnowledge base updated successfully.")

    print(
        f"Total documents processed: {len(documents)}"
    )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":
    import asyncio

    asyncio.run(main())