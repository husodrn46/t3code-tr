import { uiFormat, uiText } from "@t3tools/shared/ui-turkish";
/** Diff failures currently include transport wrappers, so recognize the reason inside them. */
export function describePullRequestDiffError(error: string, providerName: string) {
  if (/\brate limit\b|\brate[-_]limited\b|\btoo many requests\b/i.test(error)) {
    return {
      title: uiFormat("{0} rate limit reached", [providerName]),
      description: uiFormat(
        "{0} is temporarily limiting requests, so this diff couldn't be loaded. Try again after the limit resets, or view the changes on {1}.",
        [providerName, providerName],
      ),
    };
  }

  return {
    title: uiText("Couldn't load the changes"),
    description: uiFormat(
      "The environment couldn't load this pull request's diff. Try again, or view the changes on {0}.",
      [providerName],
    ),
  };
}
