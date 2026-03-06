# AI Engine

Flask application exposing REST endpoints for AI jobs.

## Setup

```bash
cd "ai engine"
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Server runs at `http://127.0.0.1:5001` (debug mode).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/jobs` | List all jobs (optional query: `?status=pending`) |
| POST | `/jobs` | Submit a new job (body: `{ "type": "...", "params": { ... } }`) |
| GET | `/jobs/<id>` | Get job by ID |
| GET | `/jobs/<id>/result` | Get job result only |
| DELETE | `/jobs/<id>` | Cancel a pending job |

## Example

```bash
# Submit job
curl -X POST http://127.0.0.1:5001/jobs -H "Content-Type: application/json" -d "{\"type\": \"summarize\", \"params\": {\"text\": \"Hello world\"}}"

# List jobs
curl http://127.0.0.1:5001/jobs

# Get job
curl http://127.0.0.1:5001/jobs/<job_id>
```
