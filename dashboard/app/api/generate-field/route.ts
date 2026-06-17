import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { system_prompt, agent_name, gender, field } = await req.json();

    if (!system_prompt?.trim()) {
      return NextResponse.json(
        { error: "System prompt is required to generate content." },
        { status: 400 }
      );
    }

    if (!["greeting", "description"].includes(field)) {
      return NextResponse.json(
        { error: "field must be 'greeting' or 'description'" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const genderNote = gender
      ? `The agent is ${gender === "male" ? "male (use masculine grammar, e.g., in Hindi use 'raha hun', 'karta hun')" : "female (use feminine grammar, e.g., in Hindi use 'rahi hun', 'karti hun')"}.`
      : "";

    const prompts: Record<string, string> = {
      greeting: `You are helping configure an AI voice agent named "${agent_name || "the agent"}".
${genderNote}

Based on the following system prompt, generate a natural, warm opening greeting (1-2 sentences max) that this agent would say the moment a call connects. The greeting should:
- Match the persona and language/tone of the system prompt exactly
- Feel natural when spoken aloud on a phone call
- NOT start with "Hello" if the system prompt implies a different style
- Use correct gendered grammar if the language requires it (Hindi, etc.)
- Be concise — this is the very first thing said on the call

System Prompt:
${system_prompt}

Return ONLY the greeting text. No quotes, no explanation, no extra text.`,

      description: `You are helping configure an AI voice agent named "${agent_name || "the agent"}".

Based on the following system prompt, write a single sentence (max 15 words) that describes what this agent does. This is a dashboard label for the operator, not something the agent says.

System Prompt:
${system_prompt}

Return ONLY the one-sentence description. No quotes, no explanation.`,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompts[field] }],
        temperature: 0.6,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || `Groq API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content?.trim();

    if (!generated) {
      return NextResponse.json(
        { error: "No content generated. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ generated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
