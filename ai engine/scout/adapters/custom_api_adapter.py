from __future__ import annotations

import json
import logging
from typing import Any
from datetime import datetime, timezone

import httpx

from .base import BaseAdapter, RawItem

logger = logging.getLogger(__name__)


class CustomApiAdapter(BaseAdapter):
    """Fetches items from a custom API URL.

    If n8n credentials are provided in the source config, the adapter
    creates an n8n workflow that polls the API and triggers it.
    Otherwise it calls the API URL directly.
    """

    def fetch(self, topic: str, limit: int, config: dict[str, Any]) -> list[RawItem]:
        api_url: str = config.get("api_url", "")
        if not api_url:
            raise ValueError("custom_api source requires 'api_url' in config")

        n8n_host = config.get("n8n_host", "")
        n8n_api_key = config.get("n8n_api_key", "")

        if n8n_host and n8n_api_key:
            logger.info(
                "[CustomApiAdapter] n8n credentials found, using n8n workflow pipeline "
                "for api_url=%s",
                api_url,
            )
            return self._fetch_via_n8n(api_url, topic, limit, config, n8n_host, n8n_api_key)

        logger.info("[CustomApiAdapter] Direct fetch from api_url=%s topic=%r", api_url, topic)
        return self._fetch_direct(api_url, topic, limit, config)

    # ── Direct HTTP fetch ────────────────────────────────────────────────

    def _fetch_direct(
        self, api_url: str, topic: str, limit: int, config: dict[str, Any]
    ) -> list[RawItem]:
        headers: dict[str, str] = {}
        if config.get("api_key"):
            headers["Authorization"] = f"Bearer {config['api_key']}"

        params: dict[str, Any] = {}
        param_name = config.get("query_param", "q")
        params[param_name] = topic
        params["limit"] = limit

        logger.debug("[CustomApiAdapter] GET %s params=%s", api_url, params)

        resp = httpx.get(api_url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        body = resp.json()

        logger.debug("[CustomApiAdapter] Response status=%d body_type=%s", resp.status_code, type(body).__name__)

        raw_list = self._extract_list(body, limit)
        logger.info("[CustomApiAdapter] Extracted %d items from response", len(raw_list))

        return self._map_items(raw_list, limit, config)

    # ── n8n workflow pipeline ────────────────────────────────────────────

    def _fetch_via_n8n(
        self,
        api_url: str,
        topic: str,
        limit: int,
        config: dict[str, Any],
        n8n_host: str,
        n8n_api_key: str,
    ) -> list[RawItem]:
        n8n = httpx.Client(
            base_url=n8n_host,
            headers={"X-N8N-API-KEY": n8n_api_key},
            timeout=30,
        )

        workflow_id = config.get("n8n_workflow_id")

        if not workflow_id:
            logger.info("[CustomApiAdapter] No existing workflow, creating one for %s", api_url)
            workflow_id = self._create_n8n_workflow(n8n, api_url, topic, config)
            if not workflow_id:
                logger.warning("[CustomApiAdapter] Failed to create n8n workflow, falling back to direct fetch")
                return self._fetch_direct(api_url, topic, limit, config)
            logger.info("[CustomApiAdapter] Created n8n workflow id=%s", workflow_id)

        try:
            logger.info("[CustomApiAdapter] Triggering n8n workflow %s", workflow_id)
            exec_resp = n8n.post(f"/executions", json={
                "workflowId": workflow_id,
                "data": {"topic": topic, "limit": limit},
            })

            if exec_resp.status_code >= 400:
                logger.warning(
                    "[CustomApiAdapter] n8n execution failed status=%d body=%s, falling back",
                    exec_resp.status_code,
                    exec_resp.text[:500],
                )
                return self._fetch_direct(api_url, topic, limit, config)

            result = exec_resp.json()
            logger.debug("[CustomApiAdapter] n8n execution result keys=%s", list(result.keys()))

            data_items = result.get("data", {}).get("resultData", {}).get("runData", {})
            raw_list: list[dict] = []
            for node_results in data_items.values():
                for run in node_results:
                    if isinstance(run, dict) and "data" in run:
                        main = run["data"].get("main", [])
                        for arr in main:
                            if isinstance(arr, list):
                                for item in arr:
                                    if isinstance(item, dict) and "json" in item:
                                        raw_list.append(item["json"])

            logger.info("[CustomApiAdapter] n8n returned %d items", len(raw_list))
            return self._map_items(raw_list, limit, config)

        except Exception as exc:
            logger.exception("[CustomApiAdapter] n8n execution error: %s", exc)
            return self._fetch_direct(api_url, topic, limit, config)

    def _create_n8n_workflow(
        self, n8n: httpx.Client, api_url: str, topic: str, config: dict[str, Any]
    ) -> str | None:
        """Create a simple n8n workflow with an HTTP Request node."""
        param_name = config.get("query_param", "q")
        workflow_payload = {
            "name": f"Scout: {config.get('label', api_url[:40])}",
            "nodes": [
                {
                    "parameters": {},
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "typeVersion": 1,
                    "position": [250, 300],
                },
                {
                    "parameters": {
                        "url": api_url,
                        "method": "GET",
                        "queryParameters": {
                            "parameters": [
                                {"name": param_name, "value": topic},
                            ]
                        },
                        "options": {},
                    },
                    "name": "HTTP Request",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 4,
                    "position": [450, 300],
                },
            ],
            "connections": {
                "Start": {
                    "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
                }
            },
            "active": False,
            "settings": {},
        }

        try:
            resp = n8n.post("/workflows", json=workflow_payload)
            if resp.status_code >= 400:
                logger.error(
                    "[CustomApiAdapter] Failed to create workflow: status=%d body=%s",
                    resp.status_code,
                    resp.text[:500],
                )
                return None

            wf = resp.json()
            wf_id = wf.get("id")
            logger.info("[CustomApiAdapter] Workflow created id=%s, activating...", wf_id)

            activate_resp = n8n.patch(f"/workflows/{wf_id}", json={"active": True})
            if activate_resp.status_code < 400:
                logger.info("[CustomApiAdapter] Workflow %s activated", wf_id)
            else:
                logger.warning("[CustomApiAdapter] Failed to activate workflow %s", wf_id)

            return str(wf_id)

        except Exception as exc:
            logger.exception("[CustomApiAdapter] n8n workflow creation error: %s", exc)
            return None

    # ── Shared helpers ───────────────────────────────────────────────────

    def _map_items(
        self, raw_list: list[dict], limit: int, config: dict[str, Any]
    ) -> list[RawItem]:
        source_label = config.get("label", "Custom API")
        now = datetime.now(timezone.utc).isoformat()
        items: list[RawItem] = []

        for entry in raw_list[:limit]:
            title = (
                entry.get("title")
                or entry.get("name")
                or entry.get("id")
                or "Untitled"
            )
            snippet = (
                entry.get("description")
                or entry.get("summary")
                or entry.get("abstract")
                or entry.get("body")
                or ""
            )
            url = entry.get("url") or entry.get("link") or entry.get("html_url") or ""
            published = entry.get("published_at") or entry.get("created_at") or now

            items.append(
                RawItem(
                    title=str(title),
                    snippet=str(snippet)[:2000],
                    url=str(url),
                    source_label=source_label,
                    published_at=str(published),
                    item_type="update",
                    metadata={"raw_keys": list(entry.keys())[:20]},
                )
            )

        return items

    @staticmethod
    def _extract_list(body: Any, limit: int) -> list[dict]:
        if isinstance(body, list):
            return body[:limit]
        if isinstance(body, dict):
            for key in ("data", "results", "items", "entries", "records"):
                if key in body and isinstance(body[key], list):
                    return body[key][:limit]
            return [body]
        return []
