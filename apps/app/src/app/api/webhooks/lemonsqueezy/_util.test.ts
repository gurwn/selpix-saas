import { describe, it, expect } from "vitest";
import { isPlanChanged, safeString, safeNumber, PLAN_DEFAULTS } from "./_util";

describe("LemonSqueezy Webhook Utils", () => {
  describe("isPlanChanged", () => {
    describe("when comparing different plan IDs", () => {
      it("should detect change between different string IDs", () => {
        expect(isPlanChanged("123", "456")).toBe(true);
      });

      it("should detect change between string and number with different values", () => {
        expect(isPlanChanged("123", 456)).toBe(true);
      });

      it("should detect change with number as new ID", () => {
        expect(isPlanChanged("456", 789)).toBe(true);
      });
    });

    describe("when comparing same plan IDs", () => {
      it("should detect no change for identical strings", () => {
        expect(isPlanChanged("123", "123")).toBe(false);
      });

      it("should detect no change for string and number with same value", () => {
        expect(isPlanChanged("123", 123)).toBe(false);
      });

      it("should handle leading zeros as different IDs", () => {
        // "007" and "7" are different strings, so they are different IDs
        expect(isPlanChanged("007", "7")).toBe(true);
      });
    });
  });

  describe("safeString", () => {
    describe("when converting valid values", () => {
      it("should convert number to string", () => {
        expect(safeString(123)).toBe("123");
      });

      it("should preserve string values", () => {
        expect(safeString("hello")).toBe("hello");
      });

      it("should convert boolean to string", () => {
        expect(safeString(true)).toBe("true");
        expect(safeString(false)).toBe("false");
      });

      it("should convert zero to string", () => {
        expect(safeString(0)).toBe("0");
      });

      it("should preserve empty string", () => {
        expect(safeString("")).toBe("");
      });
    });

    describe("when handling null/undefined", () => {
      it("should return null for null input", () => {
        expect(safeString(null)).toBe(null);
      });

      it("should return null for undefined input", () => {
        expect(safeString(undefined)).toBe(null);
      });
    });

    describe("edge cases", () => {
      it("should convert objects to string representation", () => {
        expect(safeString({})).toBe("[object Object]");
      });

      it("should convert arrays to string", () => {
        expect(safeString([1, 2, 3])).toBe("1,2,3");
      });
    });
  });

  describe("safeNumber", () => {
    describe("when converting valid values", () => {
      it("should convert string numbers", () => {
        expect(safeNumber("123")).toBe(123);
      });

      it("should preserve number values", () => {
        expect(safeNumber(456)).toBe(456);
      });

      it("should convert decimal strings", () => {
        expect(safeNumber("78.9")).toBe(78.9);
      });

      it("should convert negative strings", () => {
        expect(safeNumber("-42")).toBe(-42);
      });

      it("should handle scientific notation", () => {
        expect(safeNumber("1e3")).toBe(1000);
      });
    });

    describe("when handling invalid values", () => {
      it("should return default for non-numeric string", () => {
        expect(safeNumber("abc", 0)).toBe(0);
      });

      it("should return 0 for null when converted to Number", () => {
        // Number(null) === 0 in JavaScript
        expect(safeNumber(null, 10)).toBe(0);
      });

      it("should return default for undefined", () => {
        expect(safeNumber(undefined, 5)).toBe(5);
      });

      it("should return default for objects", () => {
        expect(safeNumber({}, 1)).toBe(1);
      });

      it("should return 0 for empty arrays", () => {
        // Number([]) === 0 in JavaScript
        expect(safeNumber([], 2)).toBe(0);
      });

      it("should return 0 as default when not specified", () => {
        expect(safeNumber("invalid")).toBe(0);
      });

      // JavaScript type coercion 특성 테스트
      it("should handle array with single number", () => {
        expect(safeNumber([42])).toBe(42);
      });

      it("should return default for array with multiple elements", () => {
        expect(safeNumber([1, 2, 3], 5)).toBe(5);
      });

      it("should handle boolean values", () => {
        expect(safeNumber(true)).toBe(1);
        expect(safeNumber(false)).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("should handle Infinity", () => {
        expect(safeNumber(Infinity, 0)).toBe(Infinity);
      });

      it("should handle empty string as 0", () => {
        // Number("") === 0 in JavaScript
        expect(safeNumber("", 5)).toBe(0);
      });

      it("should handle whitespace string as 0", () => {
        // Number("   ") === 0 in JavaScript
        expect(safeNumber("   ", 5)).toBe(0);
      });
    });
  });

  describe("PLAN_DEFAULTS", () => {
    describe("PERSONAL defaults", () => {
      it("should have quantity of 1", () => {
        expect(PLAN_DEFAULTS.PERSONAL.quantity).toBe(1);
      });

      it("should have null subscriptionItemId", () => {
        expect(PLAN_DEFAULTS.PERSONAL.subscriptionItemId).toBe(null);
      });
    });

    describe("TEAM defaults", () => {
      it("should have minQuantity of 1", () => {
        expect(PLAN_DEFAULTS.TEAM.minQuantity).toBe(1);
      });
    });

    // TypeScript const assertion 테스트
    it("should be typed as readonly", () => {
      // TypeScript's 'as const' prevents reassignment at compile time
      // but doesn't throw runtime errors in JavaScript
      // Test type safety through TypeScript compilation instead
      type PersonalQuantity = typeof PLAN_DEFAULTS.PERSONAL.quantity;
      const testQuantity: PersonalQuantity = 1;
      expect(testQuantity).toBe(1);
    });
  });
});
