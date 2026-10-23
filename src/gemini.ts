import { isPos, Pos, POS_LIST } from './types';

export interface ExtractedWord {
  greek: string;
  english: string;
  pos: Pos;
}

const PROMPT = `This image is a Greek vocabulary list (Greek words with English meanings).
Extract every vocabulary entry in the order it appears.

Rules:
- "greek": copy the Greek headword exactly as printed, keeping all accents, breathing marks and iota subscripts. If the entry shows an article (ὁ, ἡ, τό) or a genitive ending / principal parts next to the headword, include them as printed (e.g. "λόγος, -ου, ὁ").
- "english": the English meaning as printed. Join multiple meanings with ", ".
- "pos": the part of speech, one of: ${POS_LIST.join(', ')}. Guess from the word itself if the list does not say.
- Skip headings, page numbers, and anything that is not a vocabulary entry.
- Do not invent entries that are not in the image.`;

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      greek: { type: 'STRING' },
      english: { type: 'STRING' },
      pos: { type: 'STRING', enum: POS_LIST },
    },
    required: ['greek', 'english', 'pos'],
  },
};

export async function extractWordsFromImage(
  apiKey: string,
  model: string,
  base64: string,
  mimeType: string,
): Promise<ExtractedWord[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Gemini 오류: ${message}`);
  }

  const parts: { text?: string; thought?: boolean }[] =
    body?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('');
  if (!text) {
    const reason = body?.candidates?.[0]?.finishReason ?? body?.promptFeedback?.blockReason;
    throw new Error(`Gemini가 단어를 돌려주지 않았어요${reason ? ` (${reason})` : ''}.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Gemini 응답을 읽을 수 없어요. 다시 시도해 주세요.');
  }
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (d): d is { greek: string; english: string; pos?: unknown } =>
        d && typeof d.greek === 'string' && typeof d.english === 'string',
    )
    .map((d) => ({
      greek: d.greek.trim(),
      english: d.english.trim(),
      pos: isPos(d.pos) ? d.pos : 'other',
    }))
    .filter((d) => d.greek.length > 0);
}
