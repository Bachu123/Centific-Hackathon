"""Usage tracker: records every LLM call with token counts and estimated cost."""

from __future__ import annotations

import atexit
import logging
import threading
import time
from typing import Any

import httpx

import config as app_config

logger = logging.getLogger(__name__)

PRICING: dict[str, tuple[float, float]] = {
    # (input_cost_per_1M_tokens, output_cost_per_1M_tokens)
    "gpt-5.4":                   (5.00, 22.50),
    "gpt-5.4-pro":               (30.00, 180.00),
    "gpt-5.4-thinking":          (5.00, 22.50),
    "gpt-5-mini":                (0.25, 2.00),
    "gpt-5.3-codex":             (1.75, 14.00),
    "gpt-4.1":                   (2.00, 8.00),
    "gpt-4.1-mini":              (0.40, 1.60),
    "gpt-4o":                    (2.50, 10.00),
    "gpt-4o-mini":               (0.15, 0.60),
    "claude-opus-4-6":           (5.00, 25.00),
    "claude-sonnet-4-6":         (3.00, 15.00),
    "claude-sonnet-4-20250514":  (3.00, 15.00),
    "claude-haiku-4-5-20251001": (1.00, 5.00),
}

DEFAULT_PRICING = (2.00, 10.00)


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    inp_rate, out_rate = PRICING.get(model, DEFAULT_PRICING)
    return (input_tokens * inp_rate + output_tokens * out_rate) / 1_000_000


class UsageTracker:
    _instance: UsageTracker | None = None

    def __init__(self) -> None:
        self._buffer: list[dict[str, Any]] = []
        self._lock = threading.Lock()
        self._flush_thread: threading.Thread | None = None
        self._running = False

    @classmethod
    def get(cls) -> UsageTracker:
        if cls._instance is None:
            cls._instance = UsageTracker()
            cls._instance.start()
        return cls._instance

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._flush_thread.start()
        atexit.register(self.flush)
        logger.info("[UsageTracker] Started (flush every 30s)")

    def record(
        self,
        service: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        agent_name: str | None = None,
        source_label: str | None = None,
    ) -> None:
        cost = _estimate_cost(model, input_tokens, output_tokens)
        entry = {
            "service": service,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": round(cost, 6),
            "agent_name": agent_name,
            "source_label": source_label,
        }
        with self._lock:
            self._buffer.append(entry)
        logger.debug(
            "[UsageTracker] Recorded: %s/%s in=%d out=%d cost=$%.4f",
            service, model, input_tokens, output_tokens, cost,
        )

    def flush(self) -> None:
        with self._lock:
            if not self._buffer:
                return
            batch = self._buffer[:]
            self._buffer.clear()

        try:
            http = httpx.Client(
                base_url=app_config.BACKEND_URL,
                headers={"X-Scout-Key": app_config.SCOUT_API_KEY},
                timeout=15,
            )
            resp = http.post("/api/scout/usage", json={"records": batch})
            resp.raise_for_status()
            logger.info("[UsageTracker] Flushed %d usage records to backend", len(batch))
        except Exception as exc:
            logger.warning("[UsageTracker] Failed to flush %d records: %s", len(batch), exc)
            with self._lock:
                self._buffer.extend(batch)

    def _flush_loop(self) -> None:
        while self._running:
            time.sleep(30)
            self.flush()


tracker = UsageTracker.get()
