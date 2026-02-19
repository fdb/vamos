import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { NARRATION } from "./src/ep01/narration.ts";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set. Add it to .env");
  process.exit(1);
}

// ElevenLabs voice ID — "Marcus" is a clear, professional male voice
// You can change this to any voice ID from your ElevenLabs account
const VOICE_ID = "6WjhCXzqp2hnSqFtrG8P";

const OUTPUT_DIR = "public/voiceover";

// Pronunciation map: technical terms → phonetic spellings for TTS.
// The narration text in narration.ts stays canonical (good for subtitles).
// These replacements are applied only when sending text to ElevenLabs.
const PRONUNCIATION_MAP: Record<string, string> = {
  JUCE: "Juice",
  GUI: "gooey",
  DAW: "daugh",
  APVTS: "A P V T S",
  ADSR: "A D S R",
  MIDI: "middy",
  VST3: "V S T 3",
  PolyBLEP: "Poly Blep",
  polyBLEP: "poly blep",
};

function applyPronunciations(text: string): string {
  let result = text;
  for (const [term, phonetic] of Object.entries(PRONUNCIATION_MAP)) {
    // Word-boundary-aware replacement to avoid partial matches
    result = result.replace(new RegExp(`\\b${term}\\b`, "g"), phonetic);
  }
  return result;
}

async function generateSegment(id: string, text: string): Promise<void> {
  const outPath = `${OUTPUT_DIR}/${id}.mp3`;

  if (existsSync(outPath)) {
    console.log(`  [skip] ${id} (already exists)`);
    return;
  }

  const ttsText = applyPronunciations(text);
  console.log(`  [gen]  ${id} (${text.length} chars)`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error for ${id}: ${response.status} ${err}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outPath, audioBuffer);
  console.log(`  [done] ${id} (${(audioBuffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allSegments = NARRATION.flatMap((scene) =>
    scene.segments.map((seg) => ({ id: seg.id, text: seg.text }))
  );

  console.log(`Generating ${allSegments.length} voiceover segments...\n`);

  for (const seg of allSegments) {
    await generateSegment(seg.id, seg.text);
    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! ${allSegments.length} segments in ${OUTPUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
