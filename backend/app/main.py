from fastapi import FastAPI

app = FastAPI(title="ClearSpeech API")


@app.get("/")
async def root():
    return {
        "message": "ClearSpeech backend is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }