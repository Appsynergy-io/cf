import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("update check worker", () => {
	afterEach(() => vi.restoreAllMocks());

	it("asks no registry when the detached refresh runs", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		await import("../update-check-worker.js");
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
