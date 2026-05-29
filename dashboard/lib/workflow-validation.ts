import type { WorkflowNode, WorkflowEdge } from "./workflow-types";

// ── Result type ───────────────────────────────────────────────────────────────

export interface NodeValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

// ── Field-level required config rules per node type ───────────────────────────

const REQUIRED_FIELDS: Record<string, { field: string; label: string }[]> = {
  send_gmail:           [{ field: "to", label: "To address" }, { field: "subject", label: "Subject" }, { field: "body", label: "Body" }],
  send_whatsapp:        [{ field: "phoneNumber", label: "Phone number" }, { field: "message", label: "Message" }],
  send_sms:             [{ field: "to", label: "To number" }, { field: "message", label: "Message" }],
  send_slack:           [{ field: "channel", label: "Channel" }, { field: "message", label: "Message" }],
  send_telegram:        [{ field: "chatId", label: "Chat ID" }, { field: "message", label: "Message" }],
  send_instagram_dm:    [{ field: "recipientId", label: "Recipient ID" }, { field: "message", label: "Message" }],
  update_lead_status:   [{ field: "newStatus", label: "New status" }],
  add_tag:              [{ field: "tagName", label: "Tag name" }],
  remove_tag:           [{ field: "tagName", label: "Tag name" }],
  trigger_outbound_call:[{ field: "phoneNumber", label: "Phone number" }],
  http_webhook:         [{ field: "url", label: "URL" }],
  add_note:             [{ field: "noteText", label: "Note text" }],
  send_notification:    [{ field: "message", label: "Message" }],
  send_to_sheets:       [{ field: "spreadsheetId", label: "Spreadsheet ID" }, { field: "sheetName", label: "Sheet name" }],
  create_calendar_event:[{ field: "title", label: "Event title" }],
  if_else:              [{ field: "field", label: "Field to check" }],
  check_lead_field:     [{ field: "field", label: "Field to check" }],
  filter_by_tag:        [{ field: "tagName", label: "Tag name" }],
  sub_workflow:         [{ field: "workflowId", label: "Workflow ID" }],
  airtable_row:         [{ field: "baseId", label: "Base ID" }, { field: "tableId", label: "Table ID" }],
  notion_page:          [{ field: "databaseId", label: "Database ID" }],
  hubspot_create_contact: [],
  salesforce_update:    [],
  webhook_received:     [{ field: "webhookPath", label: "Webhook path" }],
  lead_tag_added:       [{ field: "tagName", label: "Tag name" }],
};

// ── Node types that don't need an output edge (terminal) ─────────────────────

const TERMINAL_NODES = new Set([
  "sticky_note",
  "add_note",
  "send_notification",
]);

// ── Validate a single node ────────────────────────────────────────────────────

export function validateNode(
  node: WorkflowNode,
  allEdges: WorkflowEdge[]
): NodeValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const isTrigger = node.category === "trigger";
  const isCondition = node.category === "condition";
  const isSticky = node.type === "sticky_note";

  if (isSticky) return { valid: true, warnings: [], errors: [] };

  // ── Connection checks ──────────────────────────────────────────────────────

  const hasInputEdge = allEdges.some((e) => e.targetId === node.id);
  const hasOutputEdge = allEdges.some((e) => e.sourceId === node.id);

  if (!isTrigger && !hasInputEdge) {
    warnings.push("No input connection — this node will never run");
  }

  if (!TERMINAL_NODES.has(node.type) && !hasOutputEdge) {
    warnings.push("No output connection — workflow ends here");
  }

  // ── Condition-specific: check both branches ────────────────────────────────

  if (isCondition && (node.type === "if_else" || node.type === "check_lead_field" || node.type === "check_sentiment" || node.type === "filter_by_tag" || node.type === "check_call_count")) {
    const yesEdge = allEdges.find((e) => e.sourceId === node.id && e.sourcePort === "yes");
    const noEdge = allEdges.find((e) => e.sourceId === node.id && e.sourcePort === "no");
    if (!yesEdge) warnings.push("'Yes' branch has no connection");
    if (!noEdge) warnings.push("'No' branch has no connection");
  }

  // ── Required field checks ──────────────────────────────────────────────────

  const requiredFields = REQUIRED_FIELDS[node.type] || [];
  for (const { field, label } of requiredFields) {
    const val = node.config?.[field];
    const isEmpty = val === undefined || val === null || String(val).trim() === "";
    if (isEmpty) {
      errors.push(`"${label}" is required but not set`);
    }
  }

  // ── Pinned data note ───────────────────────────────────────────────────────

  const valid = errors.length === 0 && warnings.length === 0;
  return { valid, warnings, errors };
}

// ── Validate all nodes at once, returning a map ──────────────────────────────

export function validateAllNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Record<string, NodeValidationResult> {
  const results: Record<string, NodeValidationResult> = {};
  for (const node of nodes) {
    results[node.id] = validateNode(node, edges);
  }
  return results;
}
