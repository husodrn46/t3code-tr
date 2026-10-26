import catalog from "./ui-tr-TR.json" with { type: "json" };

const translations: Readonly<Record<string, string>> = catalog;
declare const __T3CODE_UI_LOCALE__: string | undefined;
const defaultLocale =
  typeof __T3CODE_UI_LOCALE__ !== "undefined"
    ? __T3CODE_UI_LOCALE__
    : typeof process !== "undefined"
      ? (process.env.T3CODE_UI_LANGUAGE ?? "tr-TR")
      : "tr-TR";

export function uiText(
  source: string,
  options: { locale?: string; context?: string } = {},
): string {
  const locale = options.locale ?? defaultLocale;
  if (locale !== "tr-TR") return source;
  const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(source);
  if (!parts) return source;
  const key = parts[2]!;
  const contextualKey = options.context ? `${options.context}::${key}` : key;
  const translated = Object.hasOwn(translations, contextualKey)
    ? translations[contextualKey]
    : Object.hasOwn(translations, key)
      ? translations[key]
      : undefined;
  return translated === undefined ? source : `${parts[1]}${translated}${parts[3]}`;
}
