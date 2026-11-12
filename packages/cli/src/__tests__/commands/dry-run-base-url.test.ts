import { runInTempDir } from "@cloudflare/workers-utils/test-helpers";
import { http, HttpResponse } from "msw/http";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";
import { server, setupMsw, TEST_BASE_URL } from "../helpers/msw.js";
import { runCf } from "../helpers/run-cf.js";

describe("dry-run base URL", () => {
	runInTempDir();
	setupMsw();

	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(process.stdout, "write").mockImplementation(() => true);
		vi.spyOn(process.stderr, "write").mockImplementation(() => true);
	});

	afterEach(() => vi.restoreAllMocks());

	it.each([
		["unset", undefined, "https://api.cloudflare.com/client/v4"],
		["set", TEST_BASE_URL, TEST_BASE_URL],
	])(
		"prints the URL a request goes to when CLOUDFLARE_API_BASE_URL is %s",
		async (_label, baseUrl, expectedBase) => {
			const env = {
				CLOUDFLARE_API_TOKEN: "test-token",
				CLOUDFLARE_ACCOUNT_ID: "test-account",
				CLOUDFLARE_API_BASE_URL: baseUrl,
				CF_API_BASE_URL: undefined,
				CLOUDFLARE_COMPLIANCE_REGION: undefined,
			};
			const requested: string[] = [];
			server.use(
				http.get(
					"*/accounts/test-account/workers/workers/my-worker",
					({ request }) => {
						requested.push(request.url);
						return HttpResponse.json({
							success: true,
							result: { id: "my-worker" },
						});
					}
				)
			);

			await runCf(["workers", "get", "my-worker", "--dry-run"], env);
			const printed = JSON.parse(String(logSpy.mock.calls[0]?.[0])).url;
			await runCf(["workers", "get", "my-worker"], env);

			expect(requested).toEqual([printed]);
			expect(printed).toBe(
				`${expectedBase}/accounts/test-account/workers/workers/my-worker`
			);
		}
	);
});
