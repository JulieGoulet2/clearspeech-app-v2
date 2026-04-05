import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import RewriteRequest, ClarifyRequest, RewriteResponse
from app import logic

app = FastAPI(title="ClearSpeech API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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


@app.get("/debug-env")
async def debug_env():
    value = os.getenv("OPENAI_API_KEY")
    return {
        "has_openai_key": value is not None,
        "key_prefix": value[:7] if value else None,
    }


@app.post("/rewrite", response_model=RewriteResponse)
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


@app.post("/clarify", response_model=RewriteResponse)
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
@app.get("/debug-client")
async def debug_client():
    try:
        client = logic.get_client()
        return {
            "client_created": client is not None
        }
    except Exception as e:
        return {
            "client_created": False,
            "error": str(e)
        }