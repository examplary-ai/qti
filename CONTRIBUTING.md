# Contributing

Thanks for your interest in contributing! 🎉

## Getting started

```bash
corepack enable
yarn install
yarn test
yarn build
```

Node.js 20+ is required.

## Project layout

```
src/
  ims/    IMS manifest + package (ZIP) generation and parsing
  qti/    QTI item/test/section/interaction types and XML builders
  utils/  HTML helpers, version helpers
tests/
  stubs/  Real-world XML / ZIP fixtures used by the test suite
```

## Running tests

```bash
yarn test        # single run
yarn test:watch  # watch mode
```

Please add tests for any new behaviour. When adding support for a new
QTI element or interaction, include a parsing test using a realistic
XML fixture under `tests/stubs/`.

## Commit / PR conventions

- Use feature branches: `feat/...`, `fix/...`, `docs/...`.
- Keep PRs focused and small where possible.
- Update `README.md` and `CHANGELOG.md` when behaviour changes.

## Releasing

Releases are published to npm from GitHub Actions using `semantic-release`. To publish a release, merge a PR with a commit message that follows the
conventional commits format (e.g., `feat: add new interaction type`).

## License

By contributing, you agree that your contributions will be licensed under
the MIT License.
