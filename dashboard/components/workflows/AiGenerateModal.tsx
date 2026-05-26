"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles, X, Loader2, Zap, Check, ChevronRight, AlertCircle,
  RefreshCw, Play, Mail, MessageCircle, Phone, GitBranch,
  Clock, Webhook, UserPlus, Timer, Globe, Sheet, Calendar,
  Code2, Shuffle, Bell, Key,
} from "lucide-react";
import { createWorkflow } from "@/lib/workflow-actions";
import { useRouter } from "next/navigation";
import { getNodeMetadata } from "@/lib/workflow-types";

// ── Icon map for preview ─────────────────────────────────────────────────────

const NODE_ICONS: Record<string, React.ElementType> = {
  new_lead: UserPlus, call_completed: Phone, scheduled: Clock,
  webhook_received: Webhook, manual_trigger: Play, form_submitted: Sheet,
  lead_tag_added: Zap, sentiment_detected: Sparkles,
  send_gmail: Mail, send_whatsapp: MessageCircle, send_sms: Phone,
  send_slack: Bell, send_telegram: Globe, if_else: GitBranch,
  switch_router: Shuffle, wait_delay: Timer, code_node: Code2,
  create_calendar_event: Calendar, send_to_sheets: Sheet,
  http_webhook: Globe, trigger_outbound_call: Phone,
};

// ── Prompt suggestion chips ───────────────────────────────────────────────────

const PROMPT_SUGGESTIONS = [
  { emoji: "👋", text: "When a new lead is captured, send a welcome email and WhatsApp message" },
  { emoji: "📞", text: "After a call is completed, wait 1 hour and then send a follow-up email" },
  { emoji: "🔥", text: "Manual outreach: send WhatsApp, trigger an AI call, and tag lead as contacted" },
  { emoji: "📅", text: "When a lead schedules a meeting, create a calendar event and notify the team on Slack" },
  { emoji: "🎯", text: "If lead status changes to Interested, update CRM, send email and book appointment" },
  { emoji: "📊", text: "Every day at 9 AM, send follow-up emails to all leads and log to Google Sheets" },
  { emoji: "🤖", text: "On new lead: check if email exists, if yes send email, if no send WhatsApp" },
  { emoji: "⚡", text: "Webhook received from website form, trigger outbound call immediately" },
];

// ── Step indicator ────────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  "Reading your prompt...",
  "Identifying triggers and actions...",
  "Building workflow structure...",
  "Configuring node parameters...",
  "Optimizing connections...",
  "Finalizing automation...",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPrompt?: string;
}

export default function AiGenerateModal({ isOpen, onClose, onSuccess, initialPrompt }: Props) {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiMode, setAiMode] = useState<"ai" | "smart" | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stepInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || "");
      setGeneratedWorkflow(null);
      setError("");
      setCurrentStep(0);
      setGenerating(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  // ── Load saved OpenAI key from localStorage ─────────────────────────────
  const getSavedKey = () => {
    try {
      const creds = JSON.parse(localStorage.getItem("rapidx_credentials") || "{}");
      return creds?.openai?.apiKey || "";
    } catch { return ""; }
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setGeneratedWorkflow(null);
    setError("");
    setCurrentStep(0);

    // Animate steps
    let step = 0;
    stepInterval.current = setInterval(() => {
      step++;
      if (step < GENERATION_STEPS.length) setCurrentStep(step);
      else { clearInterval(stepInterval.current!); }
    }, 400);

    try {
      const apiKey = openaiKey.trim() || getSavedKey();

      const res = await fetch("/api/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), openaiApiKey: apiKey }),
      });

      clearInterval(stepInterval.current!);
      setCurrentStep(GENERATION_STEPS.length);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const data = await res.json();
      setAiMode(data.mode || "smart");

      // Small pause to show "done" state
      await new Promise((r) => setTimeout(r, 500));
      setGeneratedWorkflow(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate workflow. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Save & Open ───────────────────────────────────────────────────────────
  const handleSaveAndOpen = async () => {
    if (!generatedWorkflow) return;
    setSaving(true);
    try {
      const created = await createWorkflow({
        name: generatedWorkflow.name,
        description: generatedWorkflow.description,
        nodes: generatedWorkflow.nodes,
        edges: generatedWorkflow.edges,
        isActive: false,
      });
      onClose();
      onSuccess();
      router.push(`/workflows/builder?id=${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  // ── Node preview card ─────────────────────────────────────────────────────
  const NodeCard = ({ node, index }: { node: any; index: number }) => {
    const meta = getNodeMetadata(node.type);
    const Icon = NODE_ICONS[node.type] || Zap;
    const color = meta?.color || "#8b949e";
    const isFirst = index === 0;

    return (
      <div
        className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2"
        style={{ animationDelay: `${index * 80}ms`, animationDuration: "300ms", animationFillMode: "both" }}
      >
        {/* Connector */}
        {index > 0 && (
          <div className="absolute left-[22px] -top-5 w-px h-5 bg-gray-200 dark:bg-[#30363d]" />
        )}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ backgroundColor: `${color}18`, border: `2px solid ${color}40` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-900 dark:text-[#e6edf3] truncate">
              {node.label}
            </span>
            {isFirst && (
              <span className="text-[9px] px-1 py-px rounded font-bold" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}>
                TRIGGER
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-[#6e7681] font-mono">{node.type}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#21262d] flex-shrink-0 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#e6edf3]">
                AI Workflow Generator
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-[#6e7681]">
                Describe your automation in plain English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating || saving}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Input Section ── */}
          {!generatedWorkflow && (
            <div className="p-6 space-y-5">
              {/* Main prompt area */}
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !generating) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Describe the workflow you want to create...&#10;&#10;Examples:&#10;• When a new lead is captured, send a welcome email and WhatsApp message&#10;• Every morning at 9 AM, follow up with all contacted leads&#10;• After a call, wait 2 hours, send email and trigger another call"
                  rows={6}
                  disabled={generating}
                  className="w-full pl-9 pr-4 pt-3 pb-3 text-sm rounded-xl border-2 border-purple-200 dark:border-purple-500/30
                    bg-white dark:bg-[#161b22] text-gray-900 dark:text-[#e6edf3]
                    placeholder-gray-400 dark:placeholder-[#484f58]
                    focus:outline-none focus:border-purple-500 dark:focus:border-purple-500
                    transition-all resize-none disabled:opacity-60"
                />
                <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 dark:text-[#484f58]">
                  Ctrl + Enter to generate
                </div>
              </div>

              {/* Suggestion chips */}
              {!generating && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6e7681]">
                    Try these examples:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PROMPT_SUGGESTIONS.slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(s.text)}
                        className="flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg border border-gray-100 dark:border-[#21262d]
                          bg-gray-50/50 dark:bg-[#161b22]/50
                          hover:bg-purple-50 dark:hover:bg-purple-500/5
                          hover:border-purple-200 dark:hover:border-purple-500/30
                          text-gray-600 dark:text-[#c9d1d9] transition-all group"
                      >
                        <span className="text-base leading-5 flex-shrink-0">{s.emoji}</span>
                        <span className="text-xs leading-relaxed group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {s.text}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Show more suggestions toggle */}
                  <details className="group">
                    <summary className="text-[10px] text-gray-400 hover:text-purple-500 cursor-pointer list-none flex items-center gap-1 mt-1 transition-colors">
                      <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                      More examples...
                    </summary>
                    <div className="mt-1.5 grid grid-cols-1 gap-1.5">
                      {PROMPT_SUGGESTIONS.slice(4).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(s.text)}
                          className="flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg border border-gray-100 dark:border-[#21262d]
                            bg-gray-50/50 dark:bg-[#161b22]/50
                            hover:bg-purple-50 dark:hover:bg-purple-500/5
                            hover:border-purple-200 dark:hover:border-purple-500/30
                            text-gray-600 dark:text-[#c9d1d9] transition-all group"
                        >
                          <span className="text-base leading-5 flex-shrink-0">{s.emoji}</span>
                          <span className="text-xs leading-relaxed group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                            {s.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* OpenAI key (optional) */}
              <div>
                <button
                  onClick={() => setShowKeyField(!showKeyField)}
                  className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-purple-500 transition-colors"
                >
                  <Key className="w-3 h-3" />
                  {showKeyField ? "Hide" : "Add"} OpenAI API key for smarter generation (optional)
                </button>
                {showKeyField && (
                  <div className="mt-2 relative">
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-... (optional — uses smart generator without key)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-[#30363d]
                        bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3]
                        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30
                        focus:border-purple-500 font-mono"
                    />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Key is only used for this request. To save permanently, add it in{" "}
                      <a href="/integrations" className="text-purple-500 underline" target="_blank">Integrations → OpenAI</a>.
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Generation Progress ── */}
          {generating && (
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              {/* Animated orb */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-20 animate-ping absolute inset-0" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative z-10 shadow-xl shadow-purple-500/25">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-[#e6edf3] mb-1">
                  Building Your Workflow...
                </h3>
                <p className="text-xs text-gray-400 dark:text-[#6e7681] max-w-xs">
                  AI is analyzing your description and selecting the best nodes
                </p>
              </div>

              {/* Steps */}
              <div className="w-full max-w-xs space-y-2.5 text-left">
                {GENERATION_STEPS.map((step, idx) => {
                  const isDone = currentStep > idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                        isDone ? "text-green-500" : isCurrent ? "text-purple-500 font-semibold" : "text-gray-300 dark:text-[#484f58]"
                      }`}
                    >
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-[#30363d] flex-shrink-0" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Result Preview ── */}
          {generatedWorkflow && !generating && (
            <div className="p-6 space-y-5">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-green-700 dark:text-green-400">
                    Workflow Generated!
                  </div>
                  <div className="text-[10px] text-green-600/70 dark:text-green-400/70">
                    {aiMode === "ai" ? "✨ Powered by GPT-4o — " : "⚡ Smart generator — "}
                    {generatedWorkflow.nodes.length} nodes · {generatedWorkflow.edges.length} connections
                  </div>
                </div>
                <button
                  onClick={() => { setGeneratedWorkflow(null); setError(""); }}
                  className="text-[10px] text-green-600 hover:text-green-800 dark:hover:text-green-300 flex items-center gap-0.5 flex-shrink-0 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>

              {/* Workflow name */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-[#e6edf3]">
                  {generatedWorkflow.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#8b949e] leading-relaxed">
                  {generatedWorkflow.description}
                </p>
              </div>

              {/* Node preview */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6e7681]">
                  Workflow Nodes ({generatedWorkflow.nodes.length})
                </p>
                <div className="relative space-y-2 pl-1">
                  {/* Vertical connector line */}
                  {generatedWorkflow.nodes.length > 1 && (
                    <div
                      className="absolute left-5 top-10 bottom-6 w-px bg-gradient-to-b from-purple-300 to-transparent dark:from-purple-700 dark:to-transparent pointer-events-none"
                    />
                  )}

                  {generatedWorkflow.nodes.map((node: any, i: number) => (
                    <div key={node.id} className="relative pl-0">
                      {/* Connect indicator */}
                      {i > 0 && (
                        <div className="absolute left-5 -top-1 w-px h-2 bg-purple-200 dark:bg-purple-800" />
                      )}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-[#21262d] bg-gray-50/50 dark:bg-[#161b22]/50 hover:border-purple-200 dark:hover:border-purple-500/20 transition-colors">
                        <NodeCard node={node} index={i} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error from saving */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                  💡 After opening in the builder, you can edit node configs, adjust field values, add more nodes, and test with sample data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#21262d] flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50/50 dark:bg-[#0d1117]/50">
          {!generatedWorkflow ? (
            <>
              <div className="text-[10px] text-gray-400 dark:text-[#6e7681]">
                {prompt.length > 0
                  ? `${prompt.length} characters · ${openaiKey || getSavedKey() ? "🤖 GPT-4o mode" : "⚡ Smart mode"}`
                  : "No API key needed for basic generation"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={generating}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-[#30363d] text-gray-600 dark:text-[#c9d1d9] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white
                    bg-gradient-to-r from-purple-600 to-indigo-600
                    hover:from-purple-700 hover:to-indigo-700
                    shadow-md shadow-purple-500/25
                    transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Workflow</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setGeneratedWorkflow(null); setError(""); }}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-[#30363d] text-gray-600 dark:text-[#c9d1d9] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={handleSaveAndOpen}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white
                  bg-gradient-to-r from-purple-600 to-indigo-600
                  hover:from-purple-700 hover:to-indigo-700
                  shadow-md shadow-purple-500/25 transition-all disabled:opacity-40"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Play className="w-4 h-4" /> Open in Builder</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
