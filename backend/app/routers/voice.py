from fastapi import APIRouter, File, UploadFile, HTTPException
from app.schemas import VoiceCommandRequest, VoiceCommandResponse
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/voice", tags=["Voice"])

@router.post("/command", response_model=VoiceCommandResponse)
def parse_voice_command(payload: VoiceCommandRequest):
    """Interpret speech transcript into an authorized desktop application action."""
    parsed = VoiceService.parse_command(payload.transcript)
    return VoiceCommandResponse(
        action=parsed["action"],
        parameters=parsed["parameters"],
        requires_confirmation=parsed["requires_confirmation"],
        confirmation_message=parsed.get("confirmation_message"),
        executed=False,
        message=parsed["message"]
    )

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe raw WAV audio file locally via offline whisper engine."""
    contents = await audio.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")
    
    result = VoiceService.transcribe_audio_file(contents)
    return result
