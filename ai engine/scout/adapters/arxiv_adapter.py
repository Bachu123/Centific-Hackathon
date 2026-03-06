from __future__ import annotations

import logging
from typing import Any
from datetime import datetime

import arxiv

from .base import BaseAdapter, RawItem

logger = logging.getLogger(__name__)


class ArxivAdapter(BaseAdapter):
    """Fetches papers from arXiv using the arxiv Python client."""

    def fetch(self, topic: str, limit: int, config: dict[str, Any]) -> list[RawItem]:
        categories: list[str] = config.get("categories", [])

        query_parts = [topic]
        for cat in categories:
            query_parts.append(f"cat:{cat}")
        query_str = " AND ".join(query_parts) if categories else topic

        logger.info(
            "[ArxivAdapter] Searching arXiv query=%r max_results=%d categories=%s",
            query_str, limit, categories or "all",
        )

        client = arxiv.Client()
        search = arxiv.Search(
            query=query_str,
            max_results=limit,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending,
        )

        items: list[RawItem] = []
        try:
            for result in client.results(search):
                published = result.published
                if isinstance(published, datetime):
                    published_str = published.isoformat()
                else:
                    published_str = str(published)

                items.append(
                    RawItem(
                        title=result.title,
                        snippet=result.summary or "",
                        url=result.entry_id,
                        source_label=f"ArXiv {', '.join(categories)}" if categories else "ArXiv",
                        published_at=published_str,
                        item_type="paper",
                        metadata={
                            "authors": [a.name for a in result.authors[:10]],
                            "categories": result.categories,
                            "pdf_url": result.pdf_url,
                        },
                    )
                )

            logger.info("[ArxivAdapter] Fetched %d papers from arXiv", len(items))

        except Exception as exc:
            logger.exception("[ArxivAdapter] Error fetching from arXiv: %s", exc)
            raise

        return items
