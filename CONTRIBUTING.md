# Contributing to Strata

Thanks for your interest in contributing.

## Development setup

1. Clone the repository.
2. Install dependencies in each workspace:
   - `backend/`
   - `front/`
   - `docs/`
3. Start local services with Docker or run each app independently.

## Branching and pull requests

1. Create a feature branch from `main`.
2. Keep changes focused and atomic.
3. Open a pull request with:
   - Problem statement
   - Approach
   - Screenshots (for UI changes)
   - Test evidence
4. Link related issues when applicable.

## Coding standards

- Follow existing architecture and naming conventions.
- Keep domain logic in backend services/domain layers.
- Avoid introducing broad catch blocks that swallow errors.
- Prefer clear, typed APIs over implicit behavior.
- Do not commit secrets or local data files.

## Testing requirements

All contributions must keep the following green:

- Backend unit tests
- Backend API tests (`test:e2e`)
- Frontend unit tests
- Frontend e2e tests

Coverage target:

- Backend unit coverage: **>= 90%**
- Frontend unit coverage: **>= 90%**

Run commands from each package root:

- Backend:
  - `npm test`
  - `npm run test:e2e`
  - `npm run lint:ci`
- Frontend:
  - `npm test`
  - `npm run test:e2e`
  - `npm run lint`
- Docs:
  - `npm run build`

## Commit guidance

- Use clear, imperative commit messages.
- Keep unrelated refactors out of feature commits.
- Include tests in the same commit as behavior changes.

## Reporting bugs

Open an issue with:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Environment (OS, browser, Docker/local mode)
- Logs or screenshots when relevant

## Security issues

Please do **not** file public issues for vulnerabilities.
See [`SECURITY.md`](SECURITY.md) for responsible disclosure instructions.
