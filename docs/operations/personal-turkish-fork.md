# Personal Turkish Windows fork

This is an independent, unfinished personal build named **T3 Code TR**, based on upstream
`v0.1.2` (`044f07257c9684ae4543bd1e1ebf9c394e9e3830`). It is not an official T3 release.
The base working branch is `personal/tr-windows-0.1.2`; the fork's `main` remains upstream code.
The translation continuation is on `l10n/tr-ui-completion`, based on `99dcdf44a1`.
Keep Gitea integration work on its own branch and merge the translation branch when ready.

## Continue development

```sh
git clone --branch l10n/tr-ui-completion https://github.com/husodrn46/t3code-tr.git
cd t3code-tr
vp i --frozen-lockfile
git switch -c your-feature
```

Follow `AGENTS.md`. Use the Node and package manager versions declared in `package.json`.
Keep translation, Windows packaging, and new features in separate branches. Submit changes
to this fork's personal branch; do not submit unfinished personal customization upstream.
The upstream MIT license and attribution remain unchanged.

## Turkish text

The catalog contains 4,172 entries in `packages/shared/src/ui-tr-TR.json`, up from 628 in the
first preview. UI sites use `uiText` and `uiFormat` from `@t3tools/shared/ui-turkish`.
Unknown strings retain their English source text. Coverage includes setup, chat, settings,
source control screens, file/browser/device tools, usage, dynamic notifications, and Windows
menus. This is still a preview pending a visual pass on the user's Windows computer: some
runtime-generated or server-supplied messages may remain English. The separate mobile
application, provider output, and user content are outside this translation scope.

Add complete source messages to the catalog and wrap presentation text only. Preserve IDs,
enum values, paths, commands, HTML, placeholders, and JSX boundary whitespace. Use contextual
entries such as `status::Open` when the same English word has different meanings.
`uiFormat("Open {0}", [fileName])` allows Turkish word order while keeping dynamic values
unchanged. Never interpolate user data into a catalog key. The `plural-suffix::s` entry is
intentionally empty because numeric Turkish nouns do not take the English plural suffix.
`T3CODE_UI_LANGUAGE=en` selects English at web build time and in desktop processes.

Search folds Turkish dotless `ı` to `i` after Unicode normalization so dotted/dotless and
ASCII keyboard queries can find Turkish setting names. Original English setting titles and
section names remain searchable. Keep this independent of the host's locale.

## Personal application identity

`packages/shared/src/personalBuild.ts` defines the product name and Windows application ID.
Desktop defaults use `~/.t3-tr` for backend state and `t3code-tr` under Electron's application
data directory for the profile. Official profiles are not automatically migrated. An explicit
`T3CODE_HOME` overrides the backend default; do not point it at a live official installation.
Automatic updates are disabled by default so an official release does not replace this build.

## Gitea

Gitea is already supported by the upstream Forgejo/Gitea integration; do not implement a
duplicate provider. See [Source control](../user/source-control.md#forgejo-and-gitea).
Use `tea` 0.16+ or `fj`, authenticate on the machine running the T3 server, then rescan source
control in Settings. Git still needs its own credentials or SSH key. No live Gitea account or
server has been tested for this fork.

## Verification and packaging

The continuation passes the Turkish web production build, direct web and desktop type checks,
five translation helper tests, 35 desktop profile/environment/update/menu tests, 29 web
search/inheritance/Git action tests in Turkish, and 42 packaging tests. The web regression tests
also run in English with `T3CODE_UI_LANGUAGE=en`. The original preview's label and application
ID expectations have been updated for the personal build; search retains the original English
setting titles instead of dropping English queries. A new search test first failed on Turkish
dotless `ı`, then passed after the normalization fix.

The continuation's `vp run check:changed` ran 808 tests successfully in 68 files. Browser suites
could not launch because the Playwright Chromium binary is missing. Aggregate type checking
cannot start because the task runner's seccomp supervisor is unavailable in this container;
direct web and desktop type checks passed. Format and Knip passed. That aggregate run also
caught duplicate translation imports during editing; these were consolidated, and the final
scoped lint check passed. The aggregate gate therefore remains incomplete due to the environment.
Run focused tests from their owning package with the local `vp`, and rerun
`vp run check:changed` on a host with the required browser and task runner support.

There is no Windows installer yet. Build on Windows using the prerequisites in
[Development](development.md#windows-installer-prerequisites) and the existing
`scripts/build-desktop-artifact.ts` entry point. Review the existing release workflow before
adding a personal build workflow: upstream signing, publishing credentials, and private runners
are not available to this fork. Keep initial builds unsigned and manually triggered; do not
publish to upstream release or update channels. Validate installation, uninstall, data separation,
Turkish menus, and existing Gitea operations before calling the installer ready.
