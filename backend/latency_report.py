import json
from pathlib import Path
from statistics import mean, median


TRACE_FILE = Path(__file__).resolve().parent / "traces.jsonl"


def percentile(values, p):
    if not values:
        return 0

    values = sorted(values)

    index = int(round((p / 100) * (len(values) - 1)))

    return values[index]


def load_traces():
    if not TRACE_FILE.exists():
        print("traces.jsonl not found.")
        return []

    traces = []

    with open(TRACE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line:
                continue

            try:
                traces.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    return traces


def print_stats(title, values):
    if not values:
        print(f"\n{title}")
        print("No data.")
        return

    print(f"\n{title}")
    print("-" * 45)
    print(f"Count : {len(values)}")
    print(f"Mean  : {mean(values):.2f} ms")
    print(f"Median: {median(values):.2f} ms")
    print(f"P95   : {percentile(values, 95):.2f} ms")
    print(f"Min   : {min(values):.2f} ms")
    print(f"Max   : {max(values):.2f} ms")


def main():

    traces = load_traces()

    print("=" * 60)
    print("        AGENTSHIELD LATENCY REPORT")
    print("=" * 60)

    if not traces:
        print("\nNo traces available.")
        return

    response_total = []
    response_retrieval = []
    response_eval = []

    action_total = []
    action_policy = []
    action_eval = []

    for trace in traces:

        latency = trace.get("latency", {})

        trace_type = trace.get("trace_type")

        if trace_type in {"response", "attack_test"}:

            if "total_guardrail_ms" in latency:
                response_total.append(
                    latency["total_guardrail_ms"]
                )

            if "parallel_retrieval_ms" in latency:
                response_retrieval.append(
                    latency["parallel_retrieval_ms"]
                )

            if "evaluation_ms" in latency:
                response_eval.append(
                    latency["evaluation_ms"]
                )

        elif trace_type == "action":

            if "total_guardrail_ms" in latency:
                action_total.append(
                    latency["total_guardrail_ms"]
                )

            if "policy_retrieval_ms" in latency:
                action_policy.append(
                    latency["policy_retrieval_ms"]
                )

            if "evaluation_ms" in latency:
                action_eval.append(
                    latency["evaluation_ms"]
                )

    print_stats(
        "Response / Attack — Total Guardrail Latency",
        response_total
    )

    print_stats(
        "Response / Attack — Parallel Moss Retrieval",
        response_retrieval
    )

    print_stats(
        "Response / Attack — Gemini Evaluation",
        response_eval
    )

    print_stats(
        "Action — Total Guardrail Latency",
        action_total
    )

    print_stats(
        "Action — Moss Policy Retrieval",
        action_policy
    )

    print_stats(
        "Action — Gemini Evaluation",
        action_eval
    )

    print("\n" + "=" * 60)
    print("Note: These are local measurements from AgentShield traces.")
    print("=" * 60)


if __name__ == "__main__":
    main()