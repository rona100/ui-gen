import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor ---

test("shows 'Creating' label for str_replace_editor create (pending)", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("shows 'Creating' label for str_replace_editor create (completed)", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
  // green dot present
  const badge = screen.getByText("Creating App.tsx").closest("div");
  expect(badge?.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/components/Button.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor insert", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/Card.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Viewing' label for str_replace_editor view", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/index.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("shows 'Undoing edit on' label for str_replace_editor undo_edit", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/Form.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Undoing edit on Form.tsx")).toBeDefined();
});

// --- file_manager ---

test("shows 'Renaming' label for file_manager rename", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/OldName.tsx", new_path: "/NewName.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Renaming OldName.tsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/OldName.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Deleting OldName.tsx")).toBeDefined();
});

// --- fallback ---

test("falls back to raw tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolName="some_unknown_tool"
      args={{}}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// --- path handling ---

test("extracts only the filename from a nested path", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/components/ui/Modal.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Creating Modal.tsx")).toBeDefined();
});

// --- pending state shows spinner, not green dot ---

test("pending state shows spinner instead of green dot", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
