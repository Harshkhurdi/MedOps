import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/files/route";

const state = vi.hoisted(() => ({
  form: null as FormData | null,
  findPrevious: vi.fn(),
  createFile: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ csrf: vi.fn() }));
vi.mock("@/lib/record-access", () => ({
  authorizeResource: async () => ({ id: "employee" }),
}));
vi.mock("@/lib/resources", () => ({
  collection: (value: string) => value,
  delegate: () => ({ findUnique: async () => ({ id: "company-document" }) }),
}));
vi.mock("@/lib/storage", () => ({
  MAX_UPLOAD: 4 * 1024 * 1024,
  limitedFormData: async () => state.form,
  validateUpload: vi.fn(),
  validateOfficeArchive: vi.fn(),
  store: async () => ({ key: "private-file", sha256: "synthetic-hash" }),
  removeStored: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: async (fn: (tx: object) => Promise<unknown>) =>
      fn({
        storedFile: {
          findFirst: state.findPrevious,
          create: state.createFile,
        },
        auditLog: { create: vi.fn() },
      }),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  state.findPrevious.mockResolvedValue({ version: 1 });
  state.createFile.mockImplementation(async ({ data }) => ({
    id: "file",
    ...data,
  }));
});

it.each(["x".repeat(240) + ".pdf", "folder/company.pdf"])(
  "increments the stored version using the same normalized filename: %s",
  async (filename) => {
    state.form = new FormData();
    state.form.set("module", "documents");
    state.form.set("recordId", "company-document");
    state.form.set(
      "file",
      new File(["%PDF-test"], filename, { type: "application/pdf" }),
    );
    const response = await POST(
      new Request("http://localhost/api/files", { method: "POST" }),
    );
    expect(response.status).toBe(201);
    const expectedName = filename.split("/").at(-1)!.slice(0, 200);
    expect(state.findPrevious).toHaveBeenCalledWith({
      where: {
        module: "documents",
        recordId: "company-document",
        name: expectedName,
      },
      orderBy: { version: "desc" },
    });
    expect(state.createFile).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: expectedName, version: 2 }),
    });
  },
);
