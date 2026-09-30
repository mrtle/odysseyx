import { describe, expect, it } from "vitest";
import { wordCount } from "./utils";

describe("wordCount", () => {
  it("counts space-separated words in any script", () => {
    expect(wordCount("  A shy librarian must win.  ")).toBe(5);
    expect(wordCount("Мальчик нашёл старый ключ")).toBe(4);
    expect(wordCount("")).toBe(0);
  });

  it("segments scripts written without spaces", () => {
    expect(wordCount("売ります。赤ちゃんの靴、未使用。")).toBeGreaterThanOrEqual(4);
  });
});
