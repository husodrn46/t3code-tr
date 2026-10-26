import { DEFAULT_SERVER_SETTINGS, SourceControlProviderKind } from "@t3tools/contracts";
import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Option from "effect/Option";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as TestSourceControlHost from "@t3tools/source-control-testing/TestSourceControlHost";

import * as ForgejoCli from "./ForgejoCli.ts";
import * as ForgejoSourceControlProvider from "./ForgejoSourceControlProvider.ts";

const connection = {
  serverUrl: "http://git.example.test:3000/Gitea/",
  accessToken: "saved-test-token",
};
const settings = {
  ...DEFAULT_SERVER_SETTINGS,
  sourceControlHosts: { forgejo: connection },
};

it.effect.each([
  "https://other.example.test:3000/Gitea/team/repo",
  "http://git.example.test:4000/Gitea/team/repo",
  "http://git.example.test:3000/other/team/repo",
  "http://git.example.test:3000/Gitea-other/team/repo",
  "https://git.example.test:3000/Gitea/team/repo",
])("does not send the saved token to an unrelated repository: %s", (repository) =>
  Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const result = yield* cli.api({ cwd: "/repo", repository, path: "user" }).pipe(Effect.result);
    assert.strictEqual(result._tag, "Failure");
    if (result._tag === "Failure") assert.strictEqual(result.failure.reason, "authentication");
  }).pipe(
    Effect.provide(
      TestSourceControlHost.layer({
        settings,
        process: { run: () => Effect.succeed(TestSourceControlHost.processOutput("[]")) },
      }),
    ),
    Effect.provideService(
      FileSystem.FileSystem,
      FileSystem.makeNoop({ exists: () => Effect.succeed(false) }),
    ),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make(() => Effect.die("Token sent outside the configured server")),
    ),
  ),
);

it.effect.each([
  "git.example.test",
  "ftp://git.example.test",
  "https://user:password@git.example.test",
  "https://git.example.test?token=secret",
  "https://git.example.test#fragment",
])("reports an invalid saved server URL without sending credentials: %s", (serverUrl) =>
  Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const result = yield* cli
      .api({ cwd: "/repo", repository: "team/repo", path: "repos/team/repo" })
      .pipe(Effect.result);
    assert.strictEqual(result._tag, "Failure");
    if (result._tag === "Failure") assert.strictEqual(result.failure.reason, "authentication");
  }).pipe(
    Effect.provide(
      TestSourceControlHost.layer({
        settings: { ...settings, sourceControlHosts: { forgejo: { ...connection, serverUrl } } },
      }),
    ),
    Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make(() => Effect.die("Invalid server URL reached HTTP")),
    ),
  ),
);

it.effect.each(["https://other.test/user", "../user", "../../user"])(
  "rejects an API path outside the configured API: %s",
  (path) =>
    Effect.gen(function* () {
      const cli = yield* ForgejoCli.make;
      const result = yield* cli
        .api({ cwd: "/repo", repository: "team/repo", path })
        .pipe(Effect.result);
      assert.strictEqual(result._tag, "Failure");
    }).pipe(
      Effect.provide(TestSourceControlHost.layer({ settings })),
      Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
      Effect.provideService(
        HttpClient.HttpClient,
        HttpClient.make(() => Effect.die("Escaping API path reached HTTP")),
      ),
    ),
);

it.effect.each([
  "http://git.example.test:3000/Gitea/team/repo.git",
  "ssh://git@git.example.test:2222/team/repo.git",
  "git@git.example.test:team/repo.git",
])("resolves the saved server's repository for HTTP and SSH: %s", (repository) =>
  Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const target = yield* cli.resolveRepository({ cwd: "/repo", repository });
    assert.strictEqual(target.command, "api");
    assert.strictEqual(target.repository, "team/repo");
    assert.strictEqual(target.baseUrl, "http://git.example.test:3000/Gitea");
  }).pipe(
    Effect.provide(TestSourceControlHost.layer({ settings })),
    Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make(() => Effect.die("Repository resolution should not need HTTP")),
    ),
  ),
);

it.effect("uses a saved Gitea token for mounted repository reads and writes without a CLI", () =>
  Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const repository = "http://git.example.test:3000/Gitea/team/repo.git";
    const target = yield* cli.resolveRepository({ cwd: "/repo", repository });
    assert.strictEqual(target.baseUrl, "http://git.example.test:3000/Gitea");
    assert.strictEqual(target.repository, "team/repo");
    const response = yield* cli.api({
      cwd: "/repo",
      repository,
      path: "repos/team/repo/pulls",
      method: "POST",
      body: { title: "Gitea support", head: "feature", base: "main" },
    });
    assert.strictEqual(response.stdout, '{"number":7}');
  }).pipe(
    Effect.provide(TestSourceControlHost.layer({ settings })),
    Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        assert.strictEqual(
          request.url,
          "http://git.example.test:3000/Gitea/api/v1/repos/team/repo/pulls",
        );
        assert.strictEqual(request.method, "POST");
        assert.strictEqual(request.headers.authorization, "token saved-test-token");
        assert.strictEqual(request.body._tag, "Uint8Array");
        if (request.body._tag === "Uint8Array")
          assert.strictEqual(
            new TextDecoder().decode(request.body.body),
            '{"title":"Gitea support","head":"feature","base":"main"}',
          );
        return Effect.succeed(HttpClientResponse.fromWeb(request, new Response('{"number":7}')));
      }),
    ),
  ),
);

it.effect("discovers a saved Gitea account and recognizes its custom host without a CLI", () =>
  Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const discovery = yield* ForgejoSourceControlProvider.makeDiscovery.pipe(
      Effect.provideService(ForgejoCli.ForgejoCli, cli),
    );
    assert.strictEqual(discovery.type, "managed-cli");
    if (discovery.type !== "managed-cli") return;
    const result = yield* discovery.probe("/empty");
    assert.strictEqual(result.status, "available");
    assert.strictEqual(result.auth.status, "authenticated");
    assert.strictEqual(Option.getOrNull(result.auth.account), "maria");
    const provider = yield* discovery.refineUnknownRemote({
      cwd: "/repo",
      context: {
        provider: { kind: SourceControlProviderKind.make("unknown"), name: "Unknown", baseUrl: "" },
        remoteName: "origin",
        remoteUrl: "http://git.example.test:3000/Gitea/team/repo.git",
      },
    });
    assert.strictEqual(provider?.kind, "forgejo");
    assert.strictEqual(provider?.baseUrl, "http://git.example.test:3000/Gitea");
  }).pipe(
    Effect.provide(TestSourceControlHost.layer({ settings })),
    Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        assert.strictEqual(request.url, "http://git.example.test:3000/Gitea/api/v1/user");
        return Effect.succeed(
          HttpClientResponse.fromWeb(request, new Response('{"login":"maria"}')),
        );
      }),
    ),
  ),
);

it.effect.each([301, 401, 403, 404, 429])(
  "reports saved-token HTTP %s without falling back to CLI credentials or exposing response bodies",
  (status) =>
    Effect.gen(function* () {
      const cli = yield* ForgejoCli.make;
      const result = yield* cli
        .api({
          cwd: "/repo",
          repository: "http://git.example.test:3000/Gitea/team/repo",
          path: "repos/team/repo",
        })
        .pipe(Effect.result);
      assert.strictEqual(result._tag, "Failure");
      if (result._tag === "Failure") {
        assert.strictEqual(result.failure.httpStatus, status);
        assert.notInclude(result.failure.detail, connection.accessToken);
      }
    }).pipe(
      Effect.provide(TestSourceControlHost.layer({ settings })),
      Effect.provideService(FileSystem.FileSystem, FileSystem.makeNoop({})),
      Effect.provideService(
        HttpClient.HttpClient,
        HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(connection.accessToken, {
                status,
                headers: { location: "https://other.test" },
              }),
            ),
          ),
        ),
      ),
    ),
);

it.effect("applies token replacement and removal to an already running Gitea connection", () => {
  const seen: string[] = [];
  return Effect.gen(function* () {
    const cli = yield* ForgejoCli.make;
    const store = yield* TestSourceControlHost.TestSourceControlHostSettings;
    const input = {
      cwd: "/repo",
      repository: "http://git.example.test:3000/Gitea/team/repo",
      path: "repos/team/repo",
    };
    yield* cli.api(input);
    yield* store.update({ sourceControlHosts: { forgejo: { accessToken: "replacement" } } });
    yield* cli.api(input);
    yield* store.update({ sourceControlHosts: { forgejo: { accessToken: "" } } });
    const removed = yield* cli.api(input).pipe(Effect.result);
    assert.strictEqual(removed._tag, "Failure");
    if (removed._tag === "Failure") assert.strictEqual(removed.failure.reason, "authentication");
    assert.deepStrictEqual(seen, ["token saved-test-token", "token replacement"]);
  }).pipe(
    Effect.provide(
      TestSourceControlHost.layer({
        settings,
        process: { run: () => Effect.succeed(TestSourceControlHost.processOutput("[]")) },
      }),
    ),
    Effect.provideService(
      FileSystem.FileSystem,
      FileSystem.makeNoop({ exists: () => Effect.succeed(false) }),
    ),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        seen.push(request.headers.authorization ?? "");
        return Effect.succeed(HttpClientResponse.fromWeb(request, new Response("{}")));
      }),
    ),
  );
});
