# Developer Tooling & SDKs Specialist Report: Jev (TypeSafe AI) Ecosystem

**To:** Lead Researcher / Jev Research Team (Parent Agent)  
**From:** Agent 6 (Developer Tooling & SDKs Specialist)  
**Topic:** Developer Experience, Tooling Ecosystem, and SDK Architecture for Jev (TypeSafe AI)

---

### Executive Summary: The "System One" Paradigm Shift

For years, software developers have attempted to coerce autoregressive, text-generating Large Language Models into acting as deterministic software components. This creates the classic **"JSON impedance mismatch"**: an engineer prompts a 100B+ parameter model to generate a natural language string formatted as JSON, streams tokens over 3–15 seconds, spends $5–$30 per million output tokens, and wraps the invocation in brittle `try/catch` JSON parsing, Pydantic validation, retry loops, and hallucination guardrails.

**Jev (TypeSafe AI)**, founded by Diogo Almeida (co-creator of RLHF research behind ChatGPT at OpenAI), discards text/string generation entirely in favor of **System One programmatic decisions**. 

- **Contract**: Unstructured or semi-structured **State** in $\rightarrow$ Parallel **Typed Decisions + Calibrated Probabilities + Confidence** out.
- **Underlying Training & Architecture**: Trained via **Reinforcement Learning for Calibrated Decisions (RLCD)** rather than RLHF/RLVR. Jev samples all decision heads in parallel rather than token-by-token sequentially.
- **Performance**: Latency drops from 3,000–30,000 ms to **70–500 ms** (40x–200x faster). Pricing is **$0.042 / MTok input** ($42 per billion tokens) and **Output tokens are FREE** ($0.00 / MTok).
- **Type Safety**: Schema compliance is a mathematical certainty (0% schema violations) because output heads produce logit probability distributions strictly over developer-defined discrete option sets or continuous intervals.

---

## 1. Core API Architecture: State + Questions

The TypeSafe evaluation API exposes a unified REST endpoint:
```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
```

### 1.1 Request Payload Anatomy
```json
{
  "model": "jev-latest",
  "state": {
    "ticket": {
      "subject": "Duplicate charge on account",
      "messages": [
        {"sender": "user", "text": "I was charged twice for order #8841. Refund immediately!"}
      ]
    },
    "account_tier": "enterprise",
    "policy": "Duplicate transactions within 24 hours are auto-refundable."
  },
  "questions": {
    "is_refund": {
      "type": "noul",
      "instructions": "Does `ticket.messages[0].text` explicitly request a monetary refund?"
    },
    "routing": {
      "type": "choice",
      "instructions": "Which department should handle this request?",
      "criteria": {
        "billing": "Invoice disputes, duplicate charges, payment failures",
        "tech_support": "API 500 errors, SDK bugs, service degradation",
        "sales": "Contract renewals, seat additions"
      }
    },
    "customer_sentiment": {
      "type": "score",
      "instructions": "Evaluate customer frustration in `ticket.messages[0].text`",
      "criteria": [
        "Calm and informative",
        "Frustrated but polite",
        "Extremely hostile or enraged"
      ]
    }
  }
}
```

### 1.2 State & Dot-Path Semantic Binding
1. **Polymorphic State**: `state` can be a primitive string, a complex JSON object, or an array of records.
2. **Contextual Isolation**: All questions in a single request evaluate against the **same state in parallel**. Adding 10 questions incurs negligible latency penalty because they do not autoregressively condition on each other.
3. **Dot-Path Targeting**: Inside `instructions`, developers use markdown backtick notation (e.g., `` `ticket.messages[0].text` ``) to bind specific evaluation criteria directly to nested nodes in the state graph.

### 1.3 The Three Primitives: Choice, Score, and Noul

| Primitive | Semantic Meaning | Criteria Input Schema | Returns | Mathematical Nature |
| :--- | :--- | :--- | :--- | :--- |
| **`Noul`** | Binary truth evaluation ("Is this true?") | Optional: `{"true": "...", "false": "..."}` | `noul` (float: `0.0`–`1.0`) | Calibrated probability of truth. Near 1.0 is strong yes; near 0.0 is strong no; 0.5 is maximum epistemic uncertainty. Has no separate confidence scalar. |
| **`Choice`** | Categorical classification (up to 255 options) | Map of `option_key -> description \| null` | `choice`, `probabilities`, `confidence` | `choice`: argmax label.<br>`probabilities`: full softmax distribution over all options summing to 1.0.<br>`confidence`: peakedness metric in $[0, 1]$. |
| **`Score`** | Ordinal evaluation on a defined rubric | Ordered array of 2 to 10 level descriptions | `score`, `legend`, `probabilities`, `confidence` | `score`: expected value position across levels (can land continuously between levels, e.g., `1.42`).<br>`probabilities`: distribution over indices.<br>`confidence`: certainty in the score placement. |

---

## 2. Official SDK: Python (`typesafe-sdk`)

The Python SDK (`typesafe-sdk`) provides both synchronous and asynchronous clients, native Pydantic typing, configurable retries, and comprehensive error handling.

### 2.1 Installation & Configuration
```bash
pip install typesafe-sdk
# or via uv:
uv add typesafe-sdk
```

Environment variables recognized by the SDK:
- `TYPESAFE_API_KEY`: API authentication key.
- `TYPESAFE_BASE_URL`: Base endpoint (defaults to `https://api.typesafe.ai`).
- `TYPESAFE_DEFAULT_MODEL`: Default model (defaults to `jev-latest`).
- `TYPESAFE_LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warning`, `error`, `off`).

### 2.2 Async & Sync Patterns with Strongly-Typed Responses
Developers can either inspect dictionaries or bind a custom Pydantic response schema directly into `client.system_one(..., response_model=...)`.

```python
import asyncio
import os
from typing import Literal
from pydantic import BaseModel
from typesafe_sdk import (
    AsyncTypeSafeClient,
    TypeSafeClient,
    Choice,
    Score,
    Noul,
    ChoiceAnswer,
    ScoreAnswer,
    NoulAnswer,
    SystemOneResponse,
    RetryPolicy,
    TypeSafeAPIError,
)

# 1. Fully-typed Pydantic Schema Definition
class SupportTriageResponse(SystemOneResponse):
    is_urgent: NoulAnswer
    department: ChoiceAnswer
    frustration_level: ScoreAnswer

async def run_support_pipeline():
    # 2. Asynchronous client with customized exponential backoff
    retry_cfg = RetryPolicy(max_retries=3, backoff_max=0.5, timeout=2.0)
    
    async with AsyncTypeSafeClient(retry=retry_cfg) as client:
        state_data = {
            "ticket_id": "TICK-9021",
            "customer_tier": "VIP",
            "message": "Our production webhook stopped delivering payloads 30 mins ago!",
            "sla_hours": 1
        }
        
        try:
            # 3. Parallel dispatch of heterogeneous primitives
            response: SupportTriageResponse = await client.system_one(
                state=state_data,
                questions={
                    "is_urgent": Noul(
                        instructions="Does `message` indicate a critical production-blocking emergency?"
                    ),
                    "department": Choice(
                        instructions="Assign `message` to the appropriate incident team.",
                        criteria={
                            "infra": "Cloud outages, webhook failures, core service downtime",
                            "billing": "Invoice queries, failed credit card payments",
                            "security": "Breaches, credential stuffing, vulnerabilities"
                        }
                    ),
                    "frustration_level": Score(
                        instructions="Quantify the agitation level of the sender.",
                        criteria=[
                            "Level 0: Calm, routine report",
                            "Level 1: Moderate concern, urgent tone",
                            "Level 2: Severe panic or hostility"
                        ]
                    )
                },
                response_model=SupportTriageResponse
            )
            
            # 4. Zero-Parsing, Direct Primitive Consumption
            urgency_prob: float = response.is_urgent.noul
            team: str = response.department.choice
            team_confidence: float = response.department.confidence
            frustration: float = response.frustration_level.score
            
            print(f"Urgency Probability: {urgency_prob:.2f}")
            print(f"Assigned Team: {team} (Confidence: {team_confidence:.2f})")
            print(f"Probabilities Breakdown: {response.department.probabilities}")
            print(f"Continuous Score: {frustration:.2f} / 2.0")
            
            # 5. Programmatic Decision Gating
            if team_confidence < 0.65:
                # Epistemic uncertainty: route to human supervisor
                print("Escalating to human triage queue due to low model confidence.")
            elif team == "infra" and urgency_prob > 0.80:
                print("Triggering PagerDuty high-priority incident.")
                
        except TypeSafeAPIError as err:
            print(f"API Error {err.status}: {err.message} (Req ID: {err.request_id})")

if __name__ == "__main__":
    asyncio.run(run_support_pipeline())
```

---

## 3. Official SDK: Node.js/TypeScript (`@typesafe-ai/sdk`)

The TypeScript SDK provides end-to-end type inference. Developers define questions using helper constructors (`choice`, `score`, `noul`), and TypeScript automatically infers the exact string literal union for `response.answers.<key>.choice`.

### 3.1 Installation
```bash
npm install @typesafe-ai/sdk
```

### 3.2 TypeScript Inference Engine & Zero-Parsing Execution
Under the hood, `@typesafe-ai/sdk` defines conditional type unwrapping:
```typescript
type ResultFor<T> = 
  T extends NoulQuestion ? NoulResponse :
  T extends ScoreQuestion<infer S> ? ScoreResponse<S> :
  T extends ChoiceQuestion<infer E> ? ChoiceResponse<E> :
  never;

interface ChoiceResponse<T extends ChoiceCriteria> {
  readonly type: "choice";
  readonly choice: keyof T & string; // Literal Union!
  readonly probabilities: { readonly [K in keyof T]: number };
  readonly confidence: number;
}
```

### 3.3 End-to-End TypeScript Implementation
```typescript
import { TypeSafeClient, choice, score, noul } from "@typesafe-ai/sdk";

interface DocumentState {
  docId: string;
  author: string;
  text: string;
  metadata: {
    origin: string;
    verifiedDomain: boolean;
  };
}

async function evaluateSecurityRisk(doc: DocumentState) {
  const client = new TypeSafeClient({
    // Optional: overrides process.env.TYPESAFE_API_KEY
    apiKey: process.env.TYPESAFE_API_KEY,
    timeout: 3000,
    retry: {
      maxRetries: 3,
      backoffMax: 0.5,
      timeout: 2.0
    }
  });

  // Statically inferred question schema
  const questions = {
    isMalicious: noul(
      "Does `text` contain prompt injections, jailbreaks, or exfiltration vectors?"
    ),
    threatCategory: choice(
      "Classify the security threat category of the document.",
      {
        prompt_injection: "System prompt override, ignore previous instructions",
        ssrf_payload: "URL schemes attempting internal IP access (169.254, 10.0)",
        data_exfil: "Encouraging model to leak private system keys or tokens",
        benign: "No hostile intent detected; normal operational text"
      }
    ),
    riskSeverity: score(
      "Rate the overall operational risk to production if processed.",
      [
        "Negligible risk",
        "Minor anomaly, safe to sanitize",
        "Critical danger, immediate block required"
      ]
    )
  };

  const response = await client.systemOne({
    state: doc,
    questions
  });

  // =========================================================================
  // ZERO PARSING: Full Type Safety Guaranteed at Compile Time
  // =========================================================================
  // TS Compiler knows response.answers.threatCategory.choice is:
  // "prompt_injection" | "ssrf_payload" | "data_exfil" | "benign"
  const selectedThreat = response.answers.threatCategory.choice;
  const threatConfidence = response.answers.threatCategory.confidence;
  const isMaliciousProb = response.answers.isMalicious.noul;
  const severityScore = response.answers.riskSeverity.score;

  console.log(`Model Evaluated: ${response.model}`);
  console.log(`Tokens Consumed: In=${response.usage.input_tokens}, Out=${response.usage.output_tokens}`);

  // Pure deterministic software logic without regex / parsing
  if (isMaliciousProb > 0.75 || selectedThreat !== "benign") {
    if (threatConfidence >= 0.85) {
      console.warn(`[BLOCKED] Definite threat detected: ${selectedThreat} (Score: ${severityScore})`);
      return { action: "BLOCK", reason: selectedThreat };
    } else {
      console.warn(`[REVIEW] Ambiguous threat signature. Escalating to human SecOps analyst.`);
      return { action: "QUARANTINE_FOR_REVIEW", confidence: threatConfidence };
    }
  }

  return { action: "ALLOW" };
}
```

---

## 4. Java & Spring AI Ecosystem Integration

For enterprise Java ecosystems, the community-led project **`spring-ai-typesafe`** integrates Jev directly into Spring AI's pipeline architecture.

### 4.1 Maven & Gradle Dependencies
```xml
<!-- Maven pom.xml -->
<dependency>
    <groupId>org.springaicommunity</groupId>
    <artifactId>spring-ai-starter-typesafe</artifactId>
    <version>0.1.0</version>
</dependency>
```

```groovy
// Gradle build.gradle
implementation 'org.springaicommunity:spring-ai-starter-typesafe:0.1.0'
```

### 4.2 Spring Boot Auto-Configuration
In `application.yml`:
```yaml
spring:
  ai:
    typesafe:
      api-key: ${TYPESAFE_API_KEY}
      base-url: https://api.typesafe.ai
      model: jev-latest
      timeout: 2000ms
```

### 4.3 Spring AI Service Provider Interface (SPI) Integrations
`spring-ai-typesafe` provides idiomatic implementations of Spring AI components:

1. **`CallAdvisor` & `JevJudge`**: Evaluates LLM input/output pairs for hallucination, brand compliance, or prompt leakage without calling an expensive LLM judge.
2. **`JevDocumentFilter` & `JevDocumentReranker`**: Used in Spring AI RAG pipelines. Instead of vector-distance rerankers (like Cohere) or multi-token LLM summaries, Jev evaluates 50 document chunks in parallel in sub-150ms.
3. **`JevToolIndex`**: Dynamically evaluates the user's intent against registered Spring `@Tool` beans and returns the single matching tool without LLM tool-calling hallucinations.

```java
package com.enterprise.ai.service;

import org.springaicommunity.typesafe.TypeSafeClient;
import org.springaicommunity.typesafe.primitive.Choice;
import org.springaicommunity.typesafe.primitive.Noul;
import org.springaicommunity.typesafe.response.SystemOneResponse;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EnterpriseTriageService {

    private final TypeSafeClient typeSafeClient;

    public EnterpriseTriageService(TypeSafeClient typeSafeClient) {
        this.typeSafeClient = typeSafeClient;
    }

    public void processCustomerInteraction(String interactionJson) {
        SystemOneResponse response = typeSafeClient.systemOne(
            interactionJson,
            Map.of(
                "churn_risk", Noul.of("Is the customer threatening cancellation or account closure?"),
                "sentiment", Choice.of("Assess primary emotion", Map.of(
                    "positive", "Satisfied with service",
                    "neutral", "Standard transactional query",
                    "negative", "Disgruntled, filing complaints"
                ))
            )
        );

        double churnProb = response.noulValue("churn_risk");
        String sentiment = response.choiceValue("sentiment");
        double confidence = response.choiceConfidence("sentiment");

        if (churnProb > 0.70 && confidence > 0.80) {
            // Immediate programmatic retention trigger
            triggerRetentionWorkflow();
        }
    }

    private void triggerRetentionWorkflow() {
        // Business logic
    }
}
```

---

## 5. Gateway Integrations: Vercel AI Gateway & OpenRouter

Because Jev provides standard HTTP REST compliance, developers can route traffic through central enterprise AI proxies for caching, rate limiting, billing consolidation, and unified governance.

### 5.1 Vercel AI Gateway Integration
Vercel AI Gateway natively supports TypeSafe/Jev under its decision engine router.
- **Base URL**: `https://ai-gateway.vercel.sh/typesafe`
- **Model Identifier**: `typesafe-ai/jev` or `typesafe-ai/jev-latest`
- **Benefits**: Edge caching, unified team billing, latency metrics, and observability side-by-side with Vercel AI SDK deployments.

#### Python Configuration via Vercel AI Gateway
```python
import os
from typesafe_sdk import TypeSafeClient, Noul

client = TypeSafeClient(
    api_key=os.environ["VERCEL_AI_GATEWAY_KEY"],
    base_url="https://ai-gateway.vercel.sh/typesafe",
    model="typesafe-ai/jev"
)

result = client.system_one(
    state="Customer claims item was not received after 14 days.",
    questions={"eligible_refund": Noul(instructions="Is this claim eligible for auto-refund?")}
)
print(result.nouls["eligible_refund"].noul)
```

#### TypeScript Configuration via Vercel AI Gateway
```typescript
import { TypeSafeClient, noul } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  model: "typesafe-ai/jev"
});

const res = await client.systemOne({
  state: { orderAgeDays: 14, trackingStatus: "delivered_to_porch" },
  questions: {
    flagInvestigation: noul("Does delivery discrepancy require fraud investigation?")
  }
});
```

### 5.2 OpenRouter Integration
OpenRouter routes Jev through its **Decisions API** (`POST /api/alpha/decisions`).
- **Base URL**: `https://openrouter.ai/api`
- **Model Identifier**: `~typesafe/jev-latest` (or pinned version `typesafe/jev-1.13`)
- **Integration**: Supported natively in OpenRouter routing dashboards and within **Pydantic AI**.

```python
import os
from typesafe_sdk import TypeSafeClient, Choice

with TypeSafeClient(
    api_key=os.environ["OPENROUTER_API_KEY"],
    base_url="https://openrouter.ai/api",
    model="~typesafe/jev-latest"
) as client:
    response = client.system_one(
        state="Transaction amount: $9,500 from IP in Lagos, Nigeria. Card registered to Portland, OR.",
        questions={
            "risk_assessment": Choice(
                instructions="Determine transaction risk classification.",
                criteria={
                    "low": "Familiar IP or cardholder history",
                    "medium": "Unusual geographic delta, needs 2FA",
                    "high": "Obvious fraudulent velocity or impossible travel"
                }
            )
        }
    )
    print("Decision:", response.choices["risk_assessment"].choice)
    print("Confidence:", response.choices["risk_assessment"].confidence)
```

---

## 6. Architectural Design Patterns for Production

### Pattern 1: Speculative Fan-Out
In generative LLMs, developers minimize prompt questions because each question adds sequential output tokens, increasing latency and cost.  
With Jev, **questions run in parallel and output tokens are free**. Developers can execute "speculative fan-out": asking 15–20 prospective questions simultaneously, even if code only branches on 2 of them depending on initial criteria.

```python
# Batching 15 atomic questions in a single 120ms round-trip
questions = {
    "is_spam": Noul(instructions="Is this message promotional spam?"),
    "is_urgent": Noul(instructions="Is there an explicit urgent deadline?"),
    "lang": Choice(instructions="Language of text?", criteria={"en": None, "es": None, "fr": None, "other": None}),
    # Speculative questions evaluated simultaneously:
    "sql_injection": Noul(instructions="Contains SQL keywords in payload?"),
    "pii_present": Noul(instructions="Contains SSN, credit card, or passport numbers?"),
    "sentiment": Score(instructions="Tone", criteria=["Negative", "Neutral", "Positive"])
}
```

### Pattern 2: Confidence-Gated Tri-State Routing
Instead of binary branching, production systems implement tri-state routing based on the model's reported calibration:
$$\text{Action} = \begin{cases} 
\text{Auto-Execute Action}, & \text{if } \text{Confidence} \ge 0.85 \\
\text{Request User Confirmation}, & \text{if } 0.50 \le \text{Confidence} < 0.85 \\
\text{Route to Human Fallback}, & \text{if } \text{Confidence} < 0.50 
\end{cases}$$

### Pattern 3: Composite Scoring
Instead of asking a subjective open-ended prompt like *"Rate this candidate from 1 to 100"*, developers break evaluation into independent, atomic `Score` and `Noul` questions, composing the final value deterministically in code:
$$\text{FinalScore} = w_1 \cdot \text{Experience} + w_2 \cdot \text{Education} + w_3 \cdot \text{DomainFit}$$
When business priorities shift, engineers update formula weights in code instantly—without re-prompting or retraining.

---

## 7. Comparative Technical Matrix

| Dimension | Standard Frontier LLMs (GPT-4o, Claude 3.5 Sonnet) | Jev System One Model |
| :--- | :--- | :--- |
| **Output Type** | Autoregressive natural language string / JSON tokens | Logit probability distributions over defined schemas |
| **Parsing Requirement** | Heavy (`json.loads`, Pydantic validation, regex recovery) | **Zero parsing** (native typed objects & primitives) |
| **Schema Violations** | Empirical risk (hallucinated keys, malformed markdown) | **0.0% (Mathematically impossible)** |
| **Typical Latency** | 1,500 ms – 15,000 ms | **70 ms – 500 ms** |
| **Input Token Pricing** | $0.15 – $3.00 / MTok | **$0.042 / MTok** ($42 / Billion tokens) |
| **Output Token Pricing** | $0.60 – $15.00 / MTok | **FREE ($0.00 / MTok)** |
| **Parallel Questions** | Cost and latency scale linearly with extra tokens | Evaluated in parallel with sub-linear marginal overhead |
| **Uncertainty Signal** | Verbalized ("I think...", "Likely") or overconfident | **Calibrated probabilities + explicit scalar Confidence** |

---
*Report completed and filed for the Jev Research Dossier.*
