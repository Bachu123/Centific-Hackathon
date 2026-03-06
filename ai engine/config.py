import os
import sys
from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        print(f"FATAL: missing required env var {name}", file=sys.stderr)
        sys.exit(1)
    return val


# At least one AI key is required (can be set per-source in frontend too)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

SCOUT_API_KEY = _require("SCOUT_API_KEY")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3001")
ARXIV_STORAGE_PATH = os.environ.get("ARXIV_STORAGE_PATH", "./data/arxiv-papers")
