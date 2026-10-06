# Pacer useQueuer StrictMode reproduction

Standalone reproduction of duplicate processing of an initial queue item in
React development StrictMode. It uses the published `@tanstack/react-pacer@0.24.1`
package (which depends on `@tanstack/pacer@0.23.1`) and React 19.3.0. No workspace
packages, devtools, or network calls from the processing callback are involved.

**[Open the live reproduction](https://benjavicente.github.io/pacer-strick-mode-queuer/)**

## Run

Use Node.js 24.21.0 (`nvm use`) and pnpm 12.6.0. Then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. The page runs one fresh mount per case and displays
each processing callback receipt. Click **Run fresh mounts again** to repeat it.

| Build                                                                | Without StrictMode | With StrictMode                  |
| -------------------------------------------------------------------- | ------------------ | -------------------------------- |
| Development (`pnpm dev`)                                             | 1 callback         | **2 callbacks for the same job** |
| Production (`pnpm build && pnpm preview`)                            | 1 callback         | 1 callback                       |
| Static Pages reproduction (`pnpm build:pages && pnpm preview:pages`) | 1 callback         | **2 callbacks for the same job** |

## Trigger

The component in [`src/main.tsx`](src/main.tsx) contains only this hook:

```tsx
function SeededQueue({ record }) {
  useQueuer(record, {
    initialItems: ["job-1"],
    started: true,
    wait: 0,
  });
  return null;
}
```

One root renders `<SeededQueue />`; the other renders
`<StrictMode><SeededQueue /></StrictMode>`. `record` appends to a plain array outside
React. The callback never updates component state.

`useQueuer` constructs the core queue in a `useState` initializer. The core
constructor immediately processes `initialItems` when the queue is started.
React calls that initializer twice in development StrictMode and retains one
instance, but both constructors have already processed the item. Discarding an
instance cannot undo an external action, such as sending a request.

The runner uses `flushSync` outside renders and effects to finish each mount before
reading its synchronous callbacks, then unmounts the root. It does not manually
replay a mount. The expected desirable behavior is one processing callback for one
seeded job; this repository preserves the observed duplicate as a reproduction.

## Verify

```sh
pnpm exec playwright install chromium
pnpm test
```

The checks type-check the project, build both bundles, and run Chromium against
the development server, production preview, and static Pages artifact at the
repository's subpath. The tests assert the current observed counts and repeat
the comparison with fresh roots; they document the bug rather than assert that
it has been fixed.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) verifies and deploys the
static reproduction on pushes to `main` and manual workflow runs. It uses GitHub's
current official Pages actions, pinned to verified release commit SHAs, with
separate build/deploy jobs, a `github-pages` environment, and deployment permissions
limited to the deploy job. Pages uses **GitHub Actions** as its publishing source.

The published files are built with `pnpm build:pages`.
[`scripts/build-pages.mjs`](scripts/build-pages.mjs) sets `NODE_ENV=development`
before loading Vite so React's StrictMode replay is retained in the static bundle.
A normal production bundle would hide this development-only bug. Vite sets the correct `/pacer-strick-mode-queuer/` asset base, and the build goes to
`dist-pages/`. No development server is hosted on GitHub Pages.

To preview exactly what is deployed:

```sh
pnpm build:pages
pnpm preview:pages
```

Open `/pacer-strick-mode-queuer/` on the printed preview URL.

References: [GitHub's custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[Vite's Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages),
and [Vite's build modes](https://vite.dev/guide/env-and-mode#node-env-and-modes).

This reproduction was extracted and verified by an AI agent at the repository
owner's request. It contains only the example, its documentation, and its checks.
