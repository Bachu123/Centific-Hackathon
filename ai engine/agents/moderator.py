"""ModeratorAgent: reviews agent posts for quality, relevance, safety."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

import config as app_config
from agents.brain import AgentBrain

logger = logging.getLogger(__name__)


class ModeratorAgent:
    def __init__(self) -> None:
        self.brain = AgentBrain()
        self._http = httpx.Client(
            base_url=app_config.BACKEND_URL,
            headers={"X-Scout-Key": app_config.SCOUT_API_KEY},
            timeout=60,
        )
        logger.info("[Moderator] Initialized")

    def run(self) -> dict[str, Any]:
        logger.info("=" * 60)
        logger.info("[Moderator] === STARTING MODERATION RUN ===")
        logger.info("=" * 60)

        start = time.time()

        unreviewed = self._fetch_unreviewed()
        logger.info("[Moderator] Found %d unreviewed posts", len(unreviewed))

        if not unreviewed:
            logger.info("[Moderator] Nothing to review")
            return {"reviewed": 0, "approved": 0, "flagged": 0, "rejected": 0}

        agents_cache: dict[str, dict] = {}
        stats = {"reviewed": 0, "approved": 0, "flagged": 0, "rejected": 0}

        for post in unreviewed:
            agent_id = post.get("agent_id", "")
            if agent_id not in agents_cache:
                agents_cache[agent_id] = self._fetch_agent(agent_id)

            agent_info = agents_cache[agent_id]
            if not agent_info:
                logger.warning("[Moderator] Could not fetch agent %s, skipping post %s", agent_id, post["id"])
                continue

            news_body = ""
            if post.get("news_item_id"):
                news_body = self._fetch_news_summary(post["news_item_id"])

            logger.debug("[Moderator] Reviewing post %s by %s", post["id"][:8], agent_info.get("name"))

            review = self.brain.moderate_post(post, agent_info, news_body)

            if not review:
                logger.warning("[Moderator] LLM returned no review for post %s", post["id"][:8])
                continue

            status = review.get("status", "flagged")
            score = review.get("score", 50)
            reasons = review.get("reasons", [])

            self._submit_review(post["id"], status, score, reasons)

            if status == "rejected":
                self._hide_post(post["id"])

            stats["reviewed"] += 1
            stats[status] = stats.get(status, 0) + 1

            logger.info(
                "[Moderator] Post %s: %s (score=%d, reasons=%s)",
                post["id"][:8], status, score, reasons[:2],
            )

        elapsed = time.time() - start
        logger.info("=" * 60)
        logger.info(
            "[Moderator] === MODERATION COMPLETE in %.1fs — %d reviewed (approved=%d, flagged=%d, rejected=%d) ===",
            elapsed, stats["reviewed"], stats["approved"], stats["flagged"], stats["rejected"],
        )
        logger.info("=" * 60)

        return stats

    # ── Backend calls ────────────────────────────────────────────────────

    def _fetch_unreviewed(self) -> list[dict]:
        try:
            resp = self._http.get("/api/scout/unreviewed-posts")
            resp.raise_for_status()
            return resp.json().get("data", [])
        except Exception as exc:
            logger.exception("[Moderator] Failed to fetch unreviewed posts: %s", exc)
            return []

    def _fetch_agent(self, agent_id: str) -> dict:
        try:
            resp = self._http.get(f"/api/scout/agents/{agent_id}")
            resp.raise_for_status()
            return resp.json().get("data", {})
        except Exception:
            return {}

    def _fetch_news_summary(self, news_id: str) -> str:
        try:
            resp = self._http.get(f"/api/scout/news/{news_id}")
            resp.raise_for_status()
            data = resp.json().get("data", {})
            return f"{data.get('title', '')} — {data.get('summary', '')}"
        except Exception:
            return ""

    def _submit_review(self, post_id: str, status: str, score: int, reasons: list[str]) -> None:
        try:
            resp = self._http.post("/api/scout/moderation-review", json={
                "post_id": post_id,
                "status": status,
                "score": score,
                "reasons": reasons,
                "reviewed_by": "moderator_agent",
            })
            resp.raise_for_status()
        except Exception as exc:
            logger.exception("[Moderator] Failed to submit review for post %s: %s", post_id[:8], exc)

    def _hide_post(self, post_id: str) -> None:
        try:
            self._http.patch(f"/api/scout/posts/{post_id}/hide")
        except Exception as exc:
            logger.warning("[Moderator] Failed to hide post %s: %s", post_id[:8], exc)
