import { readEnvFile } from './env.js';
import { logger } from './logger.js';

const FALLBACK = '[Sprachnachricht – Transkription nicht verfügbar]';

async function transcribeBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  const env = readEnvFile(['OPENAI_API_KEY']);
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn('OPENAI_API_KEY not set — voice transcription disabled');
    return null;
  }

  try {
    const openaiModule = await import('openai');
    const OpenAI = openaiModule.default;
    const toFile = openaiModule.toFile;

    const openai = new OpenAI({ apiKey });

    const file = await toFile(buffer, filename, { type: mimeType });

    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return (result as unknown as string).trim();
  } catch (err) {
    logger.error({ err }, 'OpenAI transcription failed');
    return null;
  }
}

/**
 * Transcribe an OGG/Opus voice message buffer (Telegram format).
 */
export async function transcribeVoice(buffer: Buffer): Promise<string> {
  const transcript = await transcribeBuffer(buffer, 'voice.ogg', 'audio/ogg');
  return transcript ?? FALLBACK;
}
