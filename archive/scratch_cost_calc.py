import pandas as pd
import numpy as np

# Pricing definitions ($ per 1 Million tokens)
models = {
    "Jev (TypeSafe AI)": {"in": 0.042, "out": 0.0, "latency_ms": 114, "hallucination_rate": 0.0},
    "Gemini 1.5 Flash (<=128k)": {"in": 0.075, "out": 0.30, "latency_ms": 650, "hallucination_rate": 0.04},
    "GPT-4o-mini": {"in": 0.150, "out": 0.60, "latency_ms": 950, "hallucination_rate": 0.035},
    "Claude 3.5 Haiku": {"in": 0.800, "out": 4.00, "latency_ms": 1100, "hallucination_rate": 0.025},
    "GPT-4o": {"in": 2.500, "out": 10.00, "latency_ms": 2800, "hallucination_rate": 0.018},
    "Claude 3.5 Sonnet": {"in": 3.000, "out": 15.00, "latency_ms": 3800, "hallucination_rate": 0.015},
    "Claude Fable 5.1 / GPT-6 Astra": {"in": 10.000, "out": 30.00, "latency_ms": 8566, "hallucination_rate": 0.010}
}

# Workloads
workloads = [
    {"name": "Ultra-Low Latency Routing (Choice / Smart-If)", "in_tok": 250, "out_tok": 40},
    {"name": "Real-Time Game / Robotics Tick (10 Hz State)", "in_tok": 1200, "out_tok": 60},
    {"name": "Customer Support Ticket Triaging (Score & Route)", "in_tok": 1800, "out_tok": 180},
    {"name": "Multi-Factor Fraud / Compliance Evaluation (3 Questions)", "in_tok": 3500, "out_tok": 250},
    {"name": "Complex Document / Contract Risk Extraction", "in_tok": 6500, "out_tok": 450},
    {"name": "Codebase AST Linter / Semantic Security Scan", "in_tok": 12000, "out_tok": 600}
]

print("=== UNIT DECISION COST MODELING ($ USD per 1 Query) ===")
results = []
for w in workloads:
    w_name = w["name"]
    inp = w["in_tok"]
    out = w["out_tok"]
    row = {"Workload": w_name, "Input Tok": inp, "Output Tok": out}
    c_jev = (inp * models["Jev (TypeSafe AI)"]["in"] + out * models["Jev (TypeSafe AI)"]["out"]) / 1e6
    row["Jev Cost ($)"] = c_jev
    for m_name, m_data in models.items():
        if m_name == "Jev (TypeSafe AI)":
            continue
        c_m = (inp * m_data["in"] + out * m_data["out"]) / 1e6
        ratio = c_m / c_jev
        row[f"{m_name} ($)"] = c_m
        row[f"{m_name} (xJev)"] = ratio
    results.append(row)

for r in results:
    print(f"Scenario: {r['Workload']} (In: {r['Input Tok']}, Out: {r['Output Tok']})")
    print(f"  Jev:             ${r['Jev Cost ($)']:.8f} (1.0x)")
    print(f"  Gemini 1.5 Flash: ${r['Gemini 1.5 Flash (<=128k) ($)']:.8f} ({r['Gemini 1.5 Flash (<=128k) (xJev)']:.1f}x)")
    print(f"  GPT-4o-mini:     ${r['GPT-4o-mini ($)']:.8f} ({r['GPT-4o-mini (xJev)']:.1f}x)")
    print(f"  Claude 3.5 Haiku: ${r['Claude 3.5 Haiku ($)']:.8f} ({r['Claude 3.5 Haiku (xJev)']:.1f}x)")
    print(f"  GPT-4o:          ${r['GPT-4o ($)']:.8f} ({r['GPT-4o (xJev)']:.1f}x)")
    print(f"  Claude 3.5 Sonnet: ${r['Claude 3.5 Sonnet ($)']:.8f} ({r['Claude 3.5 Sonnet (xJev)']:.1f}x)")
    print(f"  Claude Fable 5.1: ${r['Claude Fable 5.1 / GPT-6 Astra ($)']:.8f} ({r['Claude Fable 5.1 / GPT-6 Astra (xJev)']:.1f}x)")
    print("-" * 60)
