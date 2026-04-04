from pydantic import BaseModel, Field


class RewriteRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message")
    language_hint: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Language hint: en, fr, or de",
    )


class ClarifyRequest(BaseModel):
    original_message: str = Field(
        ...,
        min_length=1,
        description="Original user message",
    )
    clarification: str = Field(
        ...,
        min_length=1,
        description="Clarification from the user",
    )
    language_hint: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Language hint: en, fr, or de",
    )


class RewriteResponse(BaseModel):
    proposed_sentence: str
    confirmation_question: str