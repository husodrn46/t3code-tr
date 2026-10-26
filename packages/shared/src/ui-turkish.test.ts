import { describe, expect, it } from "vite-plus/test";
import { uiFormat, uiText } from "./ui-turkish.ts";
const turkishText = (source: string) => uiText(source, { locale: "tr-TR" });

describe("personal Turkish UI", () => {
  it("reorders dynamic values without treating their contents as replacements", () => {
    expect(uiFormat("Open {0}", ["İş $& {1}"], { locale: "tr-TR" })).toBe("İş $& {1} aç");
    expect(uiFormat("{0} of {1} updated", [2, 5], { locale: "tr-TR" })).toBe(
      "5 öğeden 2 tanesi güncellendi",
    );
    expect(uiFormat("Open {0}", ["İş"], { locale: "en" })).toBe("Open İş");
    expect(uiFormat("Unknown {0} and {1}", ["$1"]).toString()).toBe("Unknown $1 and {1}");
  });

  it("preserves JSX boundary whitespace around translated text", () => {
    expect(turkishText("  Settings\n")).toBe("  Ayarlar\n");
    expect(turkishText("\u00a0Cancel ")).toBe("\u00a0İptal ");
    expect(turkishText("\n  ")).toBe("\n  ");
    expect(uiText("Settings", { locale: "en" })).toBe("Settings");
  });

  it("falls back without interpreting unknown text, placeholders or object keys", () => {
    for (const source of [
      "Unknown {count}",
      "constructor",
      "__proto__",
      "<script>$&</script>",
      "",
    ]) {
      expect(turkishText(source)).toBe(source);
    }
  });

  it("keeps technical and provider identifiers unchanged", () => {
    for (const source of ["Claude Code", "Codex", "Reasoning", "Low", "gh auth login", "/api/v1"]) {
      expect(turkishText(source)).toBe(source);
    }
  });

  it("distinguishes actions from statuses and resource metrics", () => {
    expect(turkishText("Open")).toBe("Aç");
    expect(uiText("Open", { locale: "tr-TR", context: "status" })).toBe("Açık");
    expect(uiText("Read", { locale: "tr-TR", context: "metric" })).toBe("Okuma");
    expect(uiText("Read", { locale: "en", context: "metric" })).toBe("Read");
  });
});
