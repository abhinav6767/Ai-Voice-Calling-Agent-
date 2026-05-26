import { NextRequest, NextResponse } from "next/server";
import { ALL_NODE_METADATA } from "@/lib/workflow-types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ── Smart Rule-Based Generator (no API key needed) ────────────────────────────

interface GeneratedWorkflow {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}

function smartGenerate(prompt: string): GeneratedWorkflow {
  const p = prompt.toLowerCase();
  const nodes: any[] = [];
  const edges: any[] = [];

  let currentY = 60;
  let lastId: string | null = null;

  const addNode = (type: string, label: string, config: Record<string, any> = {}, x = 380) => {
    const meta = ALL_NODE_METADATA.find((n) => n.type === type);
    const id = genId("node");
    nodes.push({
      id,
      type,
      category: meta?.category || "action",
      label,
      config: { ...meta?.defaultConfig, ...config },
      position: { x, y: currentY },
    });
    if (lastId) {
      edges.push({ id: genId("edge"), sourceId: lastId, targetId: id });
    }
    lastId = id;
    currentY += 170;
    return id;
  };

  const addBranch = (trueId: string, falseId: string, conditionId: string) => {
    // Add YES edge
    edges.push({ id: genId("edge"), sourceId: conditionId, targetId: trueId, sourcePort: "yes", label: "Yes" });
    // Add NO edge  
    edges.push({ id: genId("edge"), sourceId: conditionId, targetId: falseId, sourcePort: "no", label: "No" });
  };

  // ── 1. Determine trigger ──────────────────────────────────────────────────
  if (p.includes("manual") || p.includes("button") || p.includes("on demand") || p.includes("outreach")) {
    addNode("manual_trigger", "On Manual Run", {});
  } else if (p.includes("call complet") || p.includes("after call") || p.includes("post call") || p.includes("call ends")) {
    addNode("call_completed", "Call Completed", { callDirection: "any" });
  } else if (p.includes("schedule") || p.includes("every day") || p.includes("every week") || p.includes("cron") || p.includes("daily") || p.includes("weekly") || p.includes("morning")) {
    let cron = "0 9 * * *";
    let desc = "Every day at 9:00 AM";
    if (p.includes("weekly") || p.includes("every week")) { cron = "0 9 * * 1"; desc = "Every Monday at 9:00 AM"; }
    if (p.includes("hourly")) { cron = "0 * * * *"; desc = "Every hour"; }
    addNode("scheduled", "Scheduled Trigger", { cronExpression: cron, scheduleDescription: desc });
  } else if (p.includes("webhook") || p.includes("api call") || p.includes("external")) {
    addNode("webhook_received", "Webhook Received", { webhookPath: "/api/webhook/lead-sync" });
  } else if (p.includes("status change") || p.includes("lead update") || p.includes("lead convert")) {
    addNode("lead_status_changed", "Lead Status Changed", { fromStatus: "any", toStatus: "Interested" });
  } else if (p.includes("tag") && p.includes("add")) {
    addNode("lead_tag_added", "Lead Tag Added", { tagName: "interested" });
  } else if (p.includes("form") || p.includes("enquiry") || p.includes("inquiry")) {
    addNode("form_submitted", "Form Submitted", {});
  } else if (p.includes("sentiment") || p.includes("positive") || p.includes("interested lead")) {
    addNode("sentiment_detected", "Positive Sentiment Detected", { sentimentType: "positive" });
  } else {
    // Default: new lead
    addNode("new_lead", "New Lead Captured", {});
  }

  // ── 2. Optional: If/Else condition ───────────────────────────────────────
  const hasCondition = p.includes("if") || p.includes("only if") || p.includes("when") || p.includes("qualified") || p.includes("filter") || p.includes("check");

  let conditionId: string | null = null;
  if (hasCondition && !p.includes("if not") && nodes.length > 0) {
    const meta = ALL_NODE_METADATA.find((n) => n.type === "if_else");
    const id = genId("node");
    let field = "lead.status";
    let value = "Interested";
    if (p.includes("city") || p.includes("location")) { field = "lead.city"; value = "Delhi"; }
    if (p.includes("email")) { field = "lead.email"; value = ""; }
    if (p.includes("qualified")) { field = "lead.status"; value = "Qualified"; }
    if (p.includes("score") || p.includes("high")) { field = "lead.score"; value = "80"; }

    nodes.push({
      id,
      type: "if_else",
      category: "condition",
      label: "Check Condition",
      config: { field, operator: "is_not_empty", value },
      position: { x: 380, y: currentY },
    });
    edges.push({ id: genId("edge"), sourceId: lastId!, targetId: id });
    conditionId = id;
    lastId = id;
    currentY += 170;
  }

  // ── 3. Wait / Delay ───────────────────────────────────────────────────────
  const hasDelay = p.includes("wait") || p.includes("delay") || p.includes("after") || p.includes("minutes") || p.includes("hours later");
  let delayDuration = 1;
  let delayUnit = "hours";
  if (hasDelay) {
    const minsMatch = p.match(/(\d+)\s*min/);
    const hrsMatch = p.match(/(\d+)\s*h(ou)?r/);
    const daysMatch = p.match(/(\d+)\s*day/);
    if (minsMatch) { delayDuration = parseInt(minsMatch[1]); delayUnit = "minutes"; }
    else if (hrsMatch) { delayDuration = parseInt(hrsMatch[1]); }
    else if (daysMatch) { delayDuration = parseInt(daysMatch[1]); delayUnit = "days"; }
    addNode("wait_delay", `Wait ${delayDuration} ${delayUnit}`, { duration: delayDuration, unit: delayUnit });
  }

  // ── 4. Actions ────────────────────────────────────────────────────────────
  const actionsAdded: string[] = [];

  // Gmail
  if (p.includes("email") || p.includes("gmail") || p.includes("mail") || p.includes("welcome")) {
    let subject = "Thank you for connecting with us!";
    let body = `Hi {{$json.lead.name}},\n\nThank you for reaching out to us! We've received your inquiry and will be in touch shortly.\n\nBest regards,\nThe Team`;
    if (p.includes("appointment") || p.includes("meeting") || p.includes("schedule")) {
      subject = "Your appointment is confirmed — {{$json.lead.name}}";
      body = `Hi {{$json.lead.name}},\n\nYour appointment has been scheduled. We look forward to speaking with you!\n\nBest regards,\nThe Team`;
    }
    if (p.includes("follow") || p.includes("followup") || p.includes("follow-up")) {
      subject = "Following up on your inquiry — {{$json.lead.name}}";
      body = `Hi {{$json.lead.name}},\n\nI wanted to follow up on your recent inquiry. Are you still interested?\n\nBest regards,\nThe Team`;
    }
    addNode("send_gmail", "Send Email", { to: "{{$json.lead.email}}", subject, body });
    actionsAdded.push("email");
  }

  // WhatsApp
  if (p.includes("whatsapp") || p.includes("wa ") || p.includes("message") || p.includes("text message")) {
    let message = `Hi {{$json.lead.name}}! Thanks for connecting with us. We'll be reaching out shortly. 😊`;
    if (p.includes("appointment") || p.includes("reminder")) {
      message = `Hi {{$json.lead.name}}! This is a reminder about your upcoming appointment. Please confirm your availability. 🙏`;
    }
    addNode("send_whatsapp", "Send WhatsApp", { phoneNumber: "{{$json.lead.phone}}", message });
    actionsAdded.push("whatsapp");
  }

  // SMS
  if (p.includes("sms") || p.includes("text sms")) {
    addNode("send_sms", "Send SMS", { to: "{{$json.lead.phone}}", message: `Hi {{$json.lead.name}}, thanks for your inquiry! We'll call you soon.` });
    actionsAdded.push("sms");
  }

  // Slack notification
  if (p.includes("slack") || p.includes("team notification") || p.includes("notify team") || p.includes("alert team")) {
    addNode("send_slack", "Notify Team on Slack", { channel: "#leads-alerts", message: `🔔 New Lead: *{{$json.lead.name}}* from {{$json.lead.city}} — Status: {{$json.lead.status}}` });
    actionsAdded.push("slack");
  }

  // Outbound Call
  if (p.includes("call") || p.includes("phone") || p.includes("outbound call") || p.includes("ring")) {
    addNode("trigger_outbound_call", "Trigger AI Outbound Call", { phoneNumber: "{{$json.lead.phone}}", message: "Follow-up call to discuss the customer's interest and answer any questions." });
    actionsAdded.push("call");
  }

  // Update Lead Status
  if (p.includes("update status") || p.includes("mark as") || p.includes("set status") || p.includes("crm") || p.includes("contacted")) {
    let status = "Contacted";
    if (p.includes("qualified")) status = "Qualified";
    if (p.includes("converted")) status = "Converted";
    if (p.includes("interested")) status = "Interested";
    if (p.includes("lost")) status = "Lost";
    addNode("update_lead_status", `Mark Lead as ${status}`, { newStatus: status });
    actionsAdded.push("status");
  }

  // Add Tag
  if (p.includes("tag") || p.includes("label") || p.includes("categorize")) {
    let tag = "contacted";
    if (p.includes("vip")) tag = "vip";
    if (p.includes("hot")) tag = "hot-lead";
    if (p.includes("cold")) tag = "cold-lead";
    if (p.includes("qualified")) tag = "qualified";
    addNode("add_tag", `Tag Lead: ${tag}`, { tagName: tag });
    actionsAdded.push("tag");
  }

  // Google Sheets
  if (p.includes("sheet") || p.includes("spreadsheet") || p.includes("excel") || p.includes("log") || p.includes("record")) {
    addNode("send_to_sheets", "Log to Google Sheets", { spreadsheetId: "your-spreadsheet-id", sheetName: "Leads", operation: "append" });
    actionsAdded.push("sheets");
  }

  // Google Calendar
  if (p.includes("calendar") || p.includes("appointment") || p.includes("meeting") || p.includes("book") || p.includes("schedule")) {
    addNode("create_calendar_event", "Create Calendar Event", {
      title: "Follow-up: {{$json.lead.name}}",
      description: "Follow-up call with lead from {{$json.lead.city}}",
      durationMinutes: 30,
      delayFromTrigger: 24,
      meetingType: "google_meet"
    });
    actionsAdded.push("calendar");
  }

  // HubSpot
  if (p.includes("hubspot") || p.includes("hub spot") || p.includes("crm sync")) {
    addNode("hubspot_create_contact", "Sync to HubSpot", { operation: "create" });
    actionsAdded.push("hubspot");
  }

  // Note
  if (p.includes("note") || p.includes("comment") || p.includes("log note")) {
    addNode("add_note", "Add CRM Note", { noteText: "Lead processed by automated workflow on {{$now}}." });
    actionsAdded.push("note");
  }

  // HTTP Webhook
  if (p.includes("webhook") && p.includes("send") || p.includes("api call") || p.includes("post to")) {
    addNode("http_webhook", "HTTP Request", { url: "https://your-api.example.com/leads", method: "POST", body: '{"lead": "{{$json.lead.name}}", "email": "{{$json.lead.email}}"}' });
    actionsAdded.push("http");
  }

  // Notification
  if (p.includes("notif") || p.includes("in-app") || p.includes("alert me")) {
    addNode("send_notification", "Send In-App Notification", { channel: "in_app", message: "New lead {{$json.lead.name}} processed via workflow." });
    actionsAdded.push("notification");
  }

  // Code node for transformation
  if (p.includes("transform") || p.includes("process data") || p.includes("custom code") || p.includes("calculate")) {
    addNode("code_node", "Transform Data", {
      language: "javascript",
      code: `// Access input data\nconst items = $input.all();\n\n// Transform and return\nreturn items.map(item => ({\n  ...item.json,\n  processedAt: new Date().toISOString(),\n  score: item.json.lead?.score || 0\n}));`
    });
    actionsAdded.push("code");
  }

  // Fallback: If nothing else matched, add a note and status update
  if (actionsAdded.length === 0) {
    addNode("update_lead_status", "Mark as Contacted", { newStatus: "Contacted" });
    addNode("add_note", "Log Workflow Run", { noteText: "Lead processed by automated workflow at {{$now}}." });
    addNode("send_notification", "Alert Team", { channel: "in_app", message: "New lead {{$json.lead.name}} from {{$json.lead.city}} processed." });
  }

  // Build workflow name from prompt
  let name = "AI Generated Workflow";
  const nameMatches = [
    [/welcome/i, "Welcome New Leads"],
    [/follow.?up/i, "Lead Follow-Up Sequence"],
    [/appointment|meeting|calendar/i, "Appointment Booking Flow"],
    [/onboard/i, "Lead Onboarding Pipeline"],
    [/nurt/i, "Lead Nurturing Sequence"],
    [/re-engage|re engage|reactivat/i, "Re-Engagement Campaign"],
    [/qualify/i, "Lead Qualification Flow"],
    [/outreach/i, "Outreach Campaign"],
    [/notify|alert|team/i, "Team Alert Pipeline"],
    [/call.*email|email.*call/i, "Call + Email Combo Workflow"],
  ];
  for (const [regex, wfName] of nameMatches) {
    if ((regex as RegExp).test(p)) { name = wfName as string; break; }
  }
  if (name === "AI Generated Workflow" && prompt.length < 60) {
    name = prompt.charAt(0).toUpperCase() + prompt.slice(1).replace(/[.!?]+$/, "");
  }

  return {
    name,
    description: `Generated from prompt: "${prompt}". Edit nodes to customize field values and templates.`,
    nodes,
    edges,
  };
}

// ── OpenAI-powered generation ─────────────────────────────────────────────────

async function openAiGenerate(prompt: string, apiKey: string): Promise<GeneratedWorkflow> {
  const nodeList = ALL_NODE_METADATA.map((n) => `${n.type} (${n.label}): ${n.description}`).join("\n");

  const systemPrompt = `You are a workflow automation expert. Generate a JSON workflow from the user's description.

Available node types:
${nodeList}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Human-readable workflow name",
  "description": "Brief description",
  "nodes": [
    {
      "id": "node_1",
      "type": "one_of_the_available_types",
      "category": "trigger|action|condition",
      "label": "Display name",
      "config": {},
      "position": {"x": 380, "y": 60}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "sourceId": "node_1",
      "targetId": "node_2",
      "sourcePort": "default|yes|no"
    }
  ]
}

Rules:
- First node MUST be a trigger
- Space nodes 170px apart vertically (y: 60, 230, 400, ...)
- Use $json.lead.email, $json.lead.name, $json.lead.phone in config templates
- For if_else nodes, create two outgoing edges with sourcePort "yes" and "no"
- Config should have realistic values matching the node type
- Maximum 8 nodes`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  // Strip markdown code block if present
  const cleaned = content.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned);
}

// ── API Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, openaiApiKey } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Prompt is required (min 5 characters)" }, { status: 400 });
    }

    let result: GeneratedWorkflow;
    let mode: "ai" | "smart" = "smart";

    // Try OpenAI first if key is provided
    if (openaiApiKey && openaiApiKey.startsWith("sk-")) {
      try {
        result = await openAiGenerate(prompt.trim(), openaiApiKey);
        mode = "ai";
      } catch (err) {
        console.warn("OpenAI generation failed, falling back to smart generator:", err);
        result = smartGenerate(prompt.trim());
      }
    } else {
      result = smartGenerate(prompt.trim());
    }

    // Validate result has nodes
    if (!result.nodes || result.nodes.length === 0) {
      result = smartGenerate(prompt.trim());
    }

    return NextResponse.json({ ...result, mode });
  } catch (err: any) {
    console.error("Generate workflow error:", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
