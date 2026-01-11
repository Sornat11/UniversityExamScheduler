import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
    it("joins truthy class names with spaces", () => {
        expect(cx("one", false, "two", null, undefined, "three")).toBe("one two three");
    });

    it("returns an empty string when no classes are provided", () => {
        expect(cx()).toBe("");
    });
});
