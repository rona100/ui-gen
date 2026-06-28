import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

const SUCCESS = { success: true };
const FAILURE = { success: false, error: "Invalid credentials" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("useAuth — isLoading", () => {
  test("is true during signIn and false after", async () => {
    let resolveFn!: (v: any) => void;
    mockSignIn.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { result } = renderHook(() => useAuth());

    let signInPromise: Promise<any>;
    act(() => {
      signInPromise = result.current.signIn("a@b.com", "password");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFn(FAILURE);
      await signInPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("is true during signUp and false after", async () => {
    let resolveFn!: (v: any) => void;
    mockSignUp.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { result } = renderHook(() => useAuth());

    let signUpPromise: Promise<any>;
    act(() => {
      signUpPromise = result.current.signUp("a@b.com", "password");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFn(FAILURE);
      await signUpPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signIn action throws", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signIn failure", () => {
  test("returns failure result without navigating", async () => {
    mockSignIn.mockResolvedValue(FAILURE);

    const { result } = renderHook(() => useAuth());
    let returned: any;

    await act(async () => {
      returned = await result.current.signIn("a@b.com", "wrongpassword");
    });

    expect(returned).toEqual(FAILURE);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockCreateProject).not.toHaveBeenCalled();
  });
});

describe("useAuth — signIn success, post-sign-in routing", () => {
  test("routes to anon-work project when anon work has messages", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "Hello" }],
      fileSystemData: { "/App.tsx": {} },
    });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "Hello" }],
        data: { "/App.tsx": {} },
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  test("project name includes current time when saving anon work", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "Hi" }],
      fileSystemData: {},
    });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    const nameArg = mockCreateProject.mock.calls[0][0].name;
    expect(nameArg).toMatch(/^Design from /);
  });

  test("skips anon work and routes to most recent project when anon work has no messages", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([
      { id: "project-1" },
      { id: "project-2" },
    ] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/project-1");
  });

  test("routes to most recent project when no anon work", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([
      { id: "recent-project" },
      { id: "older-project" },
    ] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent-project");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  test("creates and routes to a new project when user has no existing projects", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new-id");
  });

  test("new project name is prefixed with 'New Design #'", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    const nameArg = mockCreateProject.mock.calls[0][0].name;
    expect(nameArg).toMatch(/^New Design #\d+$/);
  });

  test("returns the action result even on success", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([{ id: "p1" }] as any);

    const { result } = renderHook(() => useAuth());
    let returned: any;

    await act(async () => {
      returned = await result.current.signIn("a@b.com", "password123");
    });

    expect(returned).toEqual(SUCCESS);
  });
});

describe("useAuth — signUp failure", () => {
  test("returns failure result without navigating", async () => {
    mockSignUp.mockResolvedValue(FAILURE);

    const { result } = renderHook(() => useAuth());
    let returned: any;

    await act(async () => {
      returned = await result.current.signUp("a@b.com", "short");
    });

    expect(returned).toEqual(FAILURE);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — signUp success, post-sign-in routing", () => {
  test("routes to anon-work project on successful sign-up with anon work", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "Build me a button" }],
      fileSystemData: { "/Button.tsx": {} },
    });
    mockCreateProject.mockResolvedValue({ id: "saved-anon-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@user.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "Build me a button" }],
        data: { "/Button.tsx": {} },
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/saved-anon-id");
  });

  test("creates new project when no existing projects and no anon work", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "first-project" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@user.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/first-project");
  });

  test("returns the action result even on success", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([{ id: "p1" }] as any);

    const { result } = renderHook(() => useAuth());
    let returned: any;

    await act(async () => {
      returned = await result.current.signUp("new@user.com", "password123");
    });

    expect(returned).toEqual(SUCCESS);
  });
});
