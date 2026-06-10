import { afterEach, describe, expect, it } from "vitest";
import { checkPin, validateSectionInput } from "../api/src/shared/profile.js";
import { HttpError } from "../api/src/shared/story.js";

describe("checkPin", () => {
  const original = process.env.CARETAKER_PIN;
  afterEach(() => {
    process.env.CARETAKER_PIN = original;
  });

  it("fails with 500 when the server has no PIN configured", () => {
    delete process.env.CARETAKER_PIN;
    expect(() => checkPin("1234")).toThrowError(
      expect.objectContaining({ status: 500 }) as Error,
    );
  });

  it("rejects missing, wrong, and wrong-length PINs with 401", () => {
    process.env.CARETAKER_PIN = "1234";
    for (const bad of [undefined, "", "9999", "12345", ["1234"]]) {
      try {
        checkPin(bad);
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(HttpError);
        expect((err as HttpError).status).toBe(401);
      }
    }
  });

  it("accepts the correct PIN", () => {
    process.env.CARETAKER_PIN = "1234";
    expect(() => checkPin("1234")).not.toThrow();
  });
});

describe("validateSectionInput", () => {
  it("accepts a known section with content", () => {
    expect(validateSectionInput({ section: "people", content: "# People\nMarcus." })).toEqual({
      section: "people",
      content: "# People\nMarcus.",
    });
  });

  it("rejects unknown sections", () => {
    expect(() => validateSectionInput({ section: "secrets", content: "x" })).toThrow(
      /unknown profile section/i,
    );
    expect(() => validateSectionInput({})).toThrow(/unknown profile section/i);
  });

  it("rejects empty and oversized content", () => {
    expect(() => validateSectionInput({ section: "food", content: "   " })).toThrow(/empty/i);
    expect(() =>
      validateSectionInput({ section: "food", content: "x".repeat(20_001) }),
    ).toThrow(/too long/i);
  });
});
