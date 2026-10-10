"""Measure concurrent maintenance-agent orchestration with Gemini calls stubbed."""

import argparse
import asyncio
import json
import math
import statistics
import time

import agent
from agent import FALLBACK_PLAN, triage_complaint
from models import ComplaintInput, SlaInput, TechnicianInput, TriageRequest


async def _stub_model_call(_, system_instruction, response_schema):
    if response_schema["type"] == "array":
        return FALLBACK_PLAN
    return {
        "category": "Plumbing",
        "priority": "High",
        "reason": "The leak requires a timely plumbing repair.",
    }


def _request(request_id):
    return TriageRequest(
        complaint=ComplaintInput(
            id=request_id,
            title="Kitchen sink leak",
            description="Water is leaking below the sink.",
        ),
        technicians=[
            TechnicianInput(
                id=8,
                name="On-call plumber",
                skills=["Plumbing"],
                availability="Available",
            )
        ],
        sla=SlaInput(risk="High", reason="Response is due soon."),
    )


def _percentile(values, fraction):
    return sorted(values)[max(0, math.ceil(len(values) * fraction) - 1)]


async def _run_benchmark(request_count, concurrency):
    semaphore = asyncio.Semaphore(concurrency)

    async def run_one(request_id):
        async with semaphore:
            started = time.perf_counter()
            recommendation = await triage_complaint(_request(request_id))
            elapsed_ms = (time.perf_counter() - started) * 1000
            succeeded = (
                recommendation.category == "Plumbing"
                and recommendation.recommendedTechnicianId == 8
                and recommendation.errors is None
            )
            return elapsed_ms, succeeded

    original_model_call = agent.call_gemini
    agent.call_gemini = _stub_model_call
    started = time.perf_counter()
    try:
        outcomes = await asyncio.gather(*(run_one(index + 1) for index in range(request_count)))
    finally:
        agent.call_gemini = original_model_call

    elapsed_seconds = time.perf_counter() - started
    latencies = [elapsed for elapsed, _ in outcomes]
    successes = sum(succeeded for _, succeeded in outcomes)
    return {
        "measurement": "agent orchestration with Gemini stubbed; excludes API, database, and real model latency",
        "requests": request_count,
        "concurrency": concurrency,
        "successes": successes,
        "failures": request_count - successes,
        "throughput_per_second": round(request_count / elapsed_seconds, 2),
        "latency_ms": {
            "median": round(statistics.median(latencies), 2),
            "p95": round(_percentile(latencies, 0.95), 2),
            "maximum": round(max(latencies), 2),
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--requests", type=int, default=40)
    parser.add_argument("--concurrency", type=int, default=8)
    args = parser.parse_args()
    if args.requests < 1 or args.concurrency < 1:
        parser.error("--requests and --concurrency must be positive")
    print(json.dumps(asyncio.run(_run_benchmark(args.requests, args.concurrency)), indent=2))


if __name__ == "__main__":
    main()
