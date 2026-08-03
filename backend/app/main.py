"""
main.py — FastAPI application for ClearSpeech.

Exposes three endpoints:
  POST /rewrite    — first step: rewrite the user's message
  POST /clarify    — second step: update the suggestion after clarification
  POST /transcribe — convert a recorded audio file to text (voice input)

All POST endpoints are rate-limited (50 requests per IP per 24 hours).
Requests with a valid X-Admin-Token header bypass the limit.
The header may match either ADMIN_TOKEN or TEAM_ACCESS_TOKEN.
"""
import os

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.rate_limit import check_rate_limit, is_privileged_token
from app.schemas import RewriteRequest, ClarifyRequest, RewriteResponse
from app import logic

app = FastAPI(title="ClearSpeech API")

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
DEFAULT_ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"


def _allowed_origins() -> list[str]:
    configured = os.environ.get("CORS_ALLOW_ORIGINS", "").strip()
    if not configured:
        return DEFAULT_ALLOWED_ORIGINS
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def _allowed_origin_regex() -> str:
    return os.environ.get("CORS_ALLOW_ORIGIN_REGEX", DEFAULT_ALLOWED_ORIGIN_REGEX).strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=_allowed_origin_regex(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Admin-Token"],
)


@app.get("/")
async def root():
    return {"message": "ClearSpeech backend is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/validate-team-access")
async def validate_team_access(request: RewriteRequest):
    token = request.message.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Access code is required.")
    if not is_privileged_token(token):
        raise HTTPException(status_code=401, detail="Invalid access code.")
    return {"valid": True}


@app.post("/rewrite", response_model=RewriteResponse, dependencies=[Depends(check_rate_limit)])
async def rewrite(request: RewriteRequest):
    try:
        proposed_sentence, confirmation_question = logic.propose_rewrite_and_question(
            request.message,
            request.language_hint,
        )

        return RewriteResponse(
            proposed_sentence=proposed_sentence,
            confirmation_question=confirmation_question,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")


@app.post("/clarify", response_model=RewriteResponse, dependencies=[Depends(check_rate_limit)])
async def clarify(request: ClarifyRequest):
    try:
        proposed_sentence, confirmation_question = (
            logic.propose_rewrite_after_clarification(
                request.original_message,
                request.clarification,
                request.language_hint,
            )
        )

        return RewriteResponse(
            proposed_sentence=proposed_sentence,
            confirmation_question=confirmation_question,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")


@app.post("/transcribe", dependencies=[Depends(check_rate_limit)])
async def transcribe(
    audio: UploadFile = File(...),
    language_hint: str = Form("en"),
):
    try:
        audio_bytes = await audio.read()

        transcript_text = logic.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=audio.filename or "recording.webm",
            language_hint=language_hint,
        )

        if not transcript_text or not transcript_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Speech was recorded, but no transcript was produced.",
            )

        return {"transcript": transcript_text}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
