from __future__ import annotations

import logging
from typing import Any
from datetime import datetime, timezone

from huggingface_hub import HfApi

from .base import BaseAdapter, RawItem

logger = logging.getLogger(__name__)


class HuggingFaceAdapter(BaseAdapter):
    """Fetches models, datasets, or papers from the Hugging Face Hub.

    Reads hf_token from the per-source config so each source can use
    its own credentials.
    """

    def fetch(self, topic: str, limit: int, config: dict[str, Any]) -> list[RawItem]:
        token = config.get("hf_token") or None
        hf_type = config.get("hf_type", "model")

        logger.info(
            "[HuggingFaceAdapter] Fetching type=%s topic=%r limit=%d token=%s",
            hf_type, topic, limit, "provided" if token else "none",
        )

        api = HfApi(token=token)

        if hf_type == "dataset":
            return self._fetch_datasets(api, topic, limit)
        elif hf_type == "paper":
            return self._fetch_models(api, topic, limit)
        return self._fetch_models(api, topic, limit)

    def _fetch_models(self, api: HfApi, topic: str, limit: int) -> list[RawItem]:
        logger.debug("[HuggingFaceAdapter] Searching models: %r", topic)
        models = list(api.list_models(search=topic, limit=limit, sort="lastModified", direction=-1))
        logger.info("[HuggingFaceAdapter] Found %d models", len(models))

        items: list[RawItem] = []
        for m in models:
            modified = m.lastModified
            if isinstance(modified, datetime):
                pub = modified.isoformat()
            else:
                pub = str(modified) if modified else datetime.now(timezone.utc).isoformat()

            items.append(
                RawItem(
                    title=m.modelId or "Untitled Model",
                    snippet=getattr(m, "pipeline_tag", "") or "",
                    url=f"https://huggingface.co/{m.modelId}",
                    source_label="Hugging Face",
                    published_at=pub,
                    item_type="model",
                    metadata={
                        "downloads": getattr(m, "downloads", 0),
                        "likes": getattr(m, "likes", 0),
                        "pipeline_tag": getattr(m, "pipeline_tag", None),
                        "tags": list(getattr(m, "tags", []))[:10],
                    },
                )
            )
        return items

    def _fetch_datasets(self, api: HfApi, topic: str, limit: int) -> list[RawItem]:
        logger.debug("[HuggingFaceAdapter] Searching datasets: %r", topic)
        datasets = list(api.list_datasets(search=topic, limit=limit, sort="lastModified", direction=-1))
        logger.info("[HuggingFaceAdapter] Found %d datasets", len(datasets))

        items: list[RawItem] = []
        for d in datasets:
            modified = d.lastModified
            if isinstance(modified, datetime):
                pub = modified.isoformat()
            else:
                pub = str(modified) if modified else datetime.now(timezone.utc).isoformat()

            items.append(
                RawItem(
                    title=d.id or "Untitled Dataset",
                    snippet=getattr(d, "description", "") or "",
                    url=f"https://huggingface.co/datasets/{d.id}",
                    source_label="Hugging Face",
                    published_at=pub,
                    item_type="dataset",
                    metadata={
                        "downloads": getattr(d, "downloads", 0),
                        "likes": getattr(d, "likes", 0),
                        "tags": list(getattr(d, "tags", []))[:10],
                    },
                )
            )
        return items
