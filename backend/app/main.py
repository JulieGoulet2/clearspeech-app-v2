"""
main.py — FastAPI application for ClearSpeech.

Exposes three endpoints:
  POST /rewrite    — first step: rewrite the user's message
  POST /clarify    — second step: update the suggestion after clarification
  POST /transcribe — convert a recorded audio file to text (voice input)

All POST endpoints are rate-limited (50 requests per IP per 24 hours).
Requests with a valid X-Admin-Token header bypass the limit.
"""
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.rate_limit import check_rate_limit
from app.schemas import RewriteRequest, ClarifyRequest, RewriteResponse
from app import logic

app = FastAPI(title="ClearSpeech API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://clearspeech-app-v2.vercel.app",
        "https://clearspeech-app-v2-jei8rmyzz-juliegoulet2s-projects.vercel.app",
    ],
    allow_origin_regex=r"https://clearspeech-app-v2.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "ClearSpeech backend is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe", dependencies=[Depends(check_rate_limit)])
async def transcribe(
    audio: UploadFile = File(...),
    language_hint: str = Form("en"),
):
    try:
        print(
            "[TRANSCRIBE] received:",
            bool(audio),
            "filename:",
            audio.filename,
            "content_type:",
            audio.content_type,
        )
        audio_bytes = await audio.read()
        print("[TRANSCRIBE] size_bytes:", len(audio_bytes))

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
    except Exception as e:
        print("[TRANSCRIBE] error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))