import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
import {
  backupInventory,
  restoreBackupFiles,
  verifyBackupBytes,
  verifyBackupRecords,
} from "../../scripts/file-backup";

const bytes = Buffer.from("synthetic private document");
const first = {
  id: "fileA",
  name: "document.pdf",
  mime: "application/pdf",
  size: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
};
const second = { ...first, id: "fileB" };

it("rejects corrupt backup bytes and duplicate inventory entries", () => {
  expect(() => verifyBackupBytes(first, Buffer.from("corrupt"))).toThrow(
    "Backup checksum mismatch",
  );
  expect(() => backupInventory.parse({ files: [first, first] })).toThrow(
    "duplicate file IDs",
  );
});

it("requires the full matching database snapshot before restoring keys", () => {
  expect(() => verifyBackupRecords([first], [first, second])).toThrow(
    "does not match",
  );
  expect(() =>
    verifyBackupRecords([first], [{ ...first, sha256: "0".repeat(64) }]),
  ).toThrow("does not match");
  expect(() =>
    verifyBackupRecords([second, first], [first, second]),
  ).not.toThrow();
});

it("preflights every object before any storage or database write", async () => {
  const operations = {
    read: vi
      .fn()
      .mockResolvedValueOnce(bytes)
      .mockResolvedValueOnce(Buffer.from("corrupt")),
    store: vi.fn(),
    commit: vi.fn(),
  };
  await expect(restoreBackupFiles([first, second], operations)).rejects.toThrow(
    "Backup checksum mismatch",
  );
  expect(operations.store).not.toHaveBeenCalled();
  expect(operations.commit).not.toHaveBeenCalled();
});

it("keeps original database keys when an upload fails after earlier uploads", async () => {
  const operations = {
    read: vi.fn().mockResolvedValue(bytes),
    store: vi
      .fn()
      .mockResolvedValueOnce({ key: "new-a" })
      .mockRejectedValueOnce(new Error("offline")),
    commit: vi.fn(),
  };
  await expect(restoreBackupFiles([first, second], operations)).rejects.toThrow(
    "offline",
  );
  expect(operations.commit).not.toHaveBeenCalled();
});

it("commits all restored keys together only after every upload succeeds", async () => {
  const operations = {
    read: vi.fn().mockResolvedValue(bytes),
    store: vi
      .fn()
      .mockResolvedValueOnce({ key: "new-a" })
      .mockResolvedValueOnce({ key: "new-b" }),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  await restoreBackupFiles([first, second], operations);
  expect(operations.commit).toHaveBeenCalledExactlyOnceWith([
    { id: first.id, key: "new-a" },
    { id: second.id, key: "new-b" },
  ]);
});
