# Personal Turkish Windows fork

This is an independent, unfinished personal build named **T3 Code TR**, based on upstream
`v0.1.2` (`044f07257c9684ae4543bd1e1ebf9c394e9e3830`). It is not an official T3 release.
The working branch is `personal/tr-windows-0.1.2`; the fork's `main` remains upstream code.

## Continue development

```sh
git clone --branch personal/tr-windows-0.1.2 https://github.com/husodrn46/t3code-tr.git
cd t3code-tr
vp i --frozen-lockfile
git switch -c your-feature
```

Follow `AGENTS.md`. Use the Node and package manager versions declared in `package.json`.
Keep translation, Windows packaging, and new features in separate branches. Submit changes
to this fork's personal branch; do not submit unfinished personal customization upstream.
The upstream MIT license and attribution remain unchanged.

## Turkish text

The initial catalog contains 628 entries in `packages/shared/src/ui-tr-TR.json`. UI sites use
`uiText` from `@t3tools/shared/ui-turkish`. Unknown strings retain their English source text.
This is partial coverage: dynamic messages, some long descriptions, native role menus, and
the separate mobile application still need work. Provider output and user content are not translated.

Add complete source messages to the catalog and wrap presentation text only. Preserve IDs,
enum values, paths, commands, HTML, placeholders, and JSX boundary whitespace. Use contextual
entries such as `status::Open` when the same English word has different meanings.
`T3CODE_UI_LANGUAGE=en` selects English at web build time and in desktop processes.

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

At the initial publication, the web production build, web and desktop type checks,
four translation helper tests, and 32 desktop profile/environment/update tests passed.
Run focused tests from their owning package with the local `vp`: the root multi-project
invocation failed to discover the Effect desktop tests in this environment.
The initial `vp run check:changed` completed with lint and Knip passing, 688 tests passing
and 11 tests failing across five files. This preview is not a green build. Failing files are
`GitActionsControl.logic.test.ts`, `SettingInheritance.test.ts`, `settingsSearch.test.ts`,
`DesktopApplicationMenu.test.ts`, and `scripts/build-desktop-artifact.test.ts`. They include
English label/search expectations and the original application ID. Review behavior in both
languages before changing assertions; do not simply suppress failures. Browser tests could
not launch because the Playwright Chromium binary was missing. Aggregate type checking
could not start because the task runner's seccomp supervisor is unavailable in this container;
direct web and desktop type checks passed. Formatting issues found by the initial check were
subsequently fixed with `vp fmt`. Rerun `vp run check:changed` after further changes.

There is no Windows installer yet. Build on Windows using the prerequisites in
[Development](development.md#windows-installer-prerequisites) and the existing
`scripts/build-desktop-artifact.ts` entry point. Review the existing release workflow before
adding a personal build workflow: upstream signing, publishing credentials, and private runners
are not available to this fork. Keep initial builds unsigned and manually triggered; do not
publish to upstream release or update channels. Validate installation, uninstall, data separation,
Turkish menus, and existing Gitea operations before calling the installer ready.
