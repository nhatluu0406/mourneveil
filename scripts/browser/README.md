# Browser runtime gates

Active runtime gates must call `runOwnedBrowserGate` from `runtimeGateLifecycle.mjs`.
That boundary starts one direct Vite child, creates one Playwright browser/context/page,
and closes every owned resource in an idempotent `finally` path. On Windows, forced
fallback termination targets only the recorded child PID and its tree.

Run the supported M8 gates through package scripts:

- `npm run gate:lifecycle`
- `npm run gate:m8-stabilization`
- `npm run gate:m8-skirmisher-proof`
- `npm run gate:m8-shrine`

Older milestone scripts are historical one-shot checks that expect an already running
server. They do not own that server and must not be copied as the basis for new gates.
Do not start `npm run dev` as an untracked background prerequisite for an active gate.
