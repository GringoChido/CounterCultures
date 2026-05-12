import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRates } from "../skydropx";

const mockSkyDropXResponse = {
  included: [
    {
      id: "rate-1",
      type: "rates",
      attributes: {
        provider: "FedEx",
        service_level_name: "Express Saver",
        total_pricing: 450.00,
        days: 2,
      },
    },
    {
      id: "rate-2",
      type: "rates",
      attributes: {
        provider: "FedEx",
        service_level_name: "Economy",
        total_pricing: 280.00,
        days: 5,
        max_delivery_days: 7,
      },
    },
    {
      id: "rate-3",
      type: "rates",
      attributes: {
        provider: "Estafeta",
        service_level_name: "Ground",
        total_pricing: 200.00,
        days: 7,
      },
    },
  ],
};

describe("SkyDropX getRates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when API key is absent", async () => {
    delete process.env.SKYDROPX_API_KEY;
    const rates = await getRates({
      fromZip: "37700",
      toZip: "06600",
      country: "MX",
      parcels: [{ weight_kg: 5, length_cm: 30, width_cm: 30, height_cm: 20 }],
    });
    expect(rates).toEqual([]);
  });

  it("returns FedEx rates sorted by price when available", async () => {
    process.env.SKYDROPX_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockSkyDropXResponse,
    } as Response);

    const rates = await getRates({
      fromZip: "37700",
      toZip: "06600",
      country: "MX",
      parcels: [{ weight_kg: 5, length_cm: 30, width_cm: 30, height_cm: 20 }],
    });

    expect(rates.length).toBe(2);
    expect(rates[0].carrier).toBe("fedex");
    expect(rates[0].service).toBe("economy");
    expect(rates[0].amount_mxn).toBe(280);
    expect(rates[1].carrier).toBe("fedex");
    expect(rates[1].service).toBe("express");
    expect(rates[1].amount_mxn).toBe(450);

    delete process.env.SKYDROPX_API_KEY;
  });

  it("falls back to all carriers when FedEx returns nothing", async () => {
    process.env.SKYDROPX_API_KEY = "test-key";
    const noFedexResponse = {
      included: [
        {
          id: "rate-3",
          type: "rates",
          attributes: {
            provider: "Estafeta",
            service_level_name: "Ground",
            total_pricing: 200.00,
            days: 7,
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => noFedexResponse,
    } as Response);

    const rates = await getRates({
      fromZip: "37700",
      toZip: "06600",
      country: "MX",
      parcels: [{ weight_kg: 5, length_cm: 30, width_cm: 30, height_cm: 20 }],
    });

    expect(rates.length).toBe(1);
    expect(rates[0].carrier).toBe("estafeta");

    delete process.env.SKYDROPX_API_KEY;
  });

  it("returns empty array on fetch error", async () => {
    process.env.SKYDROPX_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const rates = await getRates({
      fromZip: "37700",
      toZip: "06600",
      country: "MX",
      parcels: [{ weight_kg: 5, length_cm: 30, width_cm: 30, height_cm: 20 }],
    });

    expect(rates).toEqual([]);
    delete process.env.SKYDROPX_API_KEY;
  });
});
