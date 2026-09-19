from agent import generate_answer
from guardrail import check_response
from actions import intercept_action
from incident_trace import create_trace


async def start_chat():

    print("\n")
    print("=" * 60)
    print("        AGENTSHIELD INTERACTIVE CHAT")
    print("=" * 60)
    print("Type 'exit' or 'quit' to end the chat.\n")

    while True:

        question = input("You: ").strip()

        if not question:
            continue

        if question.lower() in {"exit", "quit"}:
            print("\nChat ended.")
            break

        print("\nAgent is thinking...")

        try:
            result = await generate_answer(question)

            print(f"Intent: {result['type']}")

            # ==================================================
            # ACTION
            # ==================================================

            if result["type"] == "action":

                action_name = result["action"]
                description = result["description"]
                params = result.get("params", {})

                print("\nProposed action:")
                print(f"  Action: {action_name}")
                print(f"  Description: {description}")
                print(f"  Parameters: {params}")

                check = await intercept_action(
                    action_name=action_name,
                    description=description,
                    params=params,
                )

                print("\nAgentShield")
                print(f"Verdict: {check['verdict']}")
                print(f"Risk: {check['risk']}/100")
                print(f"Decision: {check['decision']}")

                violations = check.get("violations", [])

                print(
                    f"Violations: "
                    f"{', '.join(violations) if violations else 'NONE'}"
                )

                print(f"Reason: {check['reason']}")

                # ------------------------------------------------
                # BLOCK
                # ------------------------------------------------

                if check["decision"] == "BLOCK":

                    print("\n🔴 Action blocked.")
                    print("Action executed: False")

                    continue

                # ------------------------------------------------
                # REVIEW
                # ------------------------------------------------

                if check["decision"] == "REVIEW":

                    print(
                        "\n🟡 This action requires your confirmation."
                    )

                    confirmation = input(
                        "Confirm this action? (yes/no): "
                    ).strip().lower()

                    if confirmation not in {"yes", "y"}:

                        print("\nAction cancelled by user.")
                        print("Action executed: False")

                        continue

                    print(
                        "\nRe-checking action with confirmation..."
                    )

                    check = await intercept_action(
                        action_name=action_name,
                        description=description,
                        params=params,
                        confirmed=True,
                    )

                    print("\nAgentShield")
                    print(f"Verdict: {check['verdict']}")
                    print(f"Risk: {check['risk']}/100")
                    print(f"Decision: {check['decision']}")

                    violations = check.get("violations", [])

                    print(
                        f"Violations: "
                        f"{', '.join(violations) if violations else 'NONE'}"
                    )

                    print(f"Reason: {check['reason']}")

                # ------------------------------------------------
                # FINAL ACTION RESULT
                # ------------------------------------------------

                if check["executed"]:

                    print("\n🟢 Action approved.")
                    print("Action executed: True")

                else:

                    print("\n🔴 Action intercepted.")
                    print("Action executed: False")

                continue

            # ==================================================
            # NORMAL RESPONSE
            # ==================================================

            answer = result["answer"]

            check = await check_response(
                question=question,
                answer=answer,
            )

            create_trace(
                trace_type="response",
                user_input=question,
                agent_output=answer,
                verdict=check["verdict"],
                risk=check["risk"],
                violations=check["violations"],
                decision=check["decision"],
                reason=check["reason"],
                evidence=check.get("evidence", []),
                policies=check.get("policies", []),
                latency=check.get("latency", {}),
            )

            print(f"\nAgent: {answer}")

            icon = (
                "🟢"
                if check["decision"] == "APPROVE"
                else "🔴"
            )

            print(
                f"{icon} {check['verdict']} | "
                f"Risk: {check['risk']}/100"
            )

        except Exception as e:

            print(f"\nError: {e}")