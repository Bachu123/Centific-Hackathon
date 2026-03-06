from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class RawItem:
    title: str
    snippet: str
    url: str
    source_label: str
    published_at: str
    item_type: str = "update"
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseAdapter(ABC):
    """Interface every scout adapter must implement."""

    @abstractmethod
    def fetch(self, topic: str, limit: int, config: dict[str, Any]) -> list[RawItem]:
        """Fetch raw items from the source.

        Args:
            topic: search query / topic string
            limit: max number of items to return
            config: source-specific config from the DB (jsonb)
        """
        ...
