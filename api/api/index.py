"""Vercel Python Serverless Function entry point.

Vercel discovers ASGI apps by importing files inside an `api/` folder relative
to the project's Root Directory (which is `api/` for this service — so the
absolute path Vercel scans is `<repo>/api/api/`).

Every request hitting the deployed URL is rewritten by `vercel.json` to
`/api/index`, which loads this module and forwards the request into the
FastAPI app defined in `app/main.py`.
"""

from app.main import app  # noqa: F401  (Vercel imports `app` as the ASGI handler)
