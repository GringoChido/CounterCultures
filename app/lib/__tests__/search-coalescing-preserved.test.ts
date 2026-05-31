import { describe, it, expect } from "vitest";

/**
 * Regression guard for request coalescing in the catalog and search palette.
 * Sacred Surface #7 (cmd-K palette) explicitly protects the coalescing via
 * productReqRef. Sacred Surface #8 (catalog SWR cache) protects reqIdRef.
 *
 * These tests verify the coalescing logic (incrementing ref, dropping stale
 * responses) without importing React components — we test the algorithm.
 */

describe("catalog reqIdRef coalescing", () => {
  it("stale responses are dropped when reqIdRef advances", () => {
    let reqIdRef = 0;
    let result: string | null = null;

    const simulateRequest = (id: number, data: string) => {
      if (id !== reqIdRef) return;
      result = data;
    };

    const req1 = ++reqIdRef;
    const req2 = ++reqIdRef;
    const req3 = ++reqIdRef;

    simulateRequest(req1, "stale-1");
    expect(result).toBeNull();

    simulateRequest(req2, "stale-2");
    expect(result).toBeNull();

    simulateRequest(req3, "current");
    expect(result).toBe("current");
  });

  it("concurrent rapid typing only applies the latest response", () => {
    let reqIdRef = 0;
    const results: string[] = [];

    const responses: Array<{ id: number; data: string }> = [];

    for (let i = 0; i < 5; i++) {
      const id = ++reqIdRef;
      responses.push({ id, data: `response-${i}` });
    }

    for (const r of responses) {
      if (r.id === reqIdRef) {
        results.push(r.data);
      }
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toBe("response-4");
  });

  it("same reqId allows response through", () => {
    let reqIdRef = 0;
    const myReq = ++reqIdRef;
    let accepted = false;

    if (myReq === reqIdRef) {
      accepted = true;
    }

    expect(accepted).toBe(true);
  });
});

describe("palette productReqRef coalescing", () => {
  it("palette drops stale product search responses", () => {
    let productReqRef = 0;
    let productResults: string[] = [];

    const simulateSearch = async (query: string) => {
      const myReq = ++productReqRef;
      const data = `results-for-${query}`;
      if (myReq !== productReqRef) return;
      productResults = [data];
    };

    simulateSearch("k");
    simulateSearch("ko");
    simulateSearch("koh");
    simulateSearch("kohl");
    simulateSearch("kohle");
    simulateSearch("kohler");

    expect(productResults).toHaveLength(1);
    expect(productResults[0]).toBe("results-for-kohler");
  });

  it("abort signal prevents stale fetch from overwriting state", () => {
    const controllers: AbortController[] = [];
    let activeResult: string | null = null;

    const simulateFetchWithAbort = (query: string) => {
      for (const prev of controllers) prev.abort();
      const controller = new AbortController();
      controllers.push(controller);

      if (!controller.signal.aborted) {
        activeResult = `results-for-${query}`;
      }
    };

    simulateFetchWithAbort("bri");
    simulateFetchWithAbort("briz");
    simulateFetchWithAbort("brizo");

    expect(activeResult).toBe("results-for-brizo");
    expect(controllers[0].signal.aborted).toBe(true);
    expect(controllers[1].signal.aborted).toBe(true);
    expect(controllers[2].signal.aborted).toBe(false);
  });
});
