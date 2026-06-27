"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const file = typeof args.path === "string"
    ? args.path.split("/").filter(Boolean).at(-1) ?? args.path
    : null;

  if (toolName === "str_replace_editor" && file) {
    switch (args.command) {
      case "create":     return `Creating ${file}`;
      case "str_replace": return `Editing ${file}`;
      case "insert":     return `Editing ${file}`;
      case "view":       return `Viewing ${file}`;
      case "undo_edit":  return `Undoing edit on ${file}`;
    }
  }

  if (toolName === "file_manager" && file) {
    switch (args.command) {
      case "rename": return `Renaming ${file}`;
      case "delete": return `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolName, args, state, result }: ToolInvocationBadgeProps) {
  const label = getLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
