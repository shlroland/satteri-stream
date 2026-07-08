# Release

This project releases from `main` with GitHub Actions, release-please, and npm Trusted Publishing.

## Branches

- `dev`: daily development branch.
- `main`: release branch. Merging or pushing releasable commits to `main` runs the release workflow.

## Commit Rules

The release workflow uses release-please with Conventional Commits:

- `fix:` creates a patch release.
- `feat:` creates a minor release.
- `feat!:` / `fix!:` / `BREAKING CHANGE:` creates a major release.
- `docs:` / `test:` / `chore:` / `ci:` do not create a release unless they are marked breaking.

When releasable commits reach `main`, release-please opens or updates a release PR. Merging that release PR creates the GitHub release and tag. The publish job then builds the package and runs `pnpm publish`.

## npm Trusted Publishing

Publishing is designed for npm Trusted Publishing, not a long-lived `NPM_TOKEN`.

Configure the package on npm with a trusted publisher:

- GitHub owner: `shlroland`
- Repository: `satteri-stream`
- Workflow filename: `release.yml`
- Package name: `satteri-stream`

The workflow grants:

```yaml
permissions:
  contents: write
  id-token: write
```

`id-token: write` lets npm exchange GitHub's OIDC identity for a short-lived publish credential. The repository should be public for npm provenance.

## Local Checks

Run the same deterministic checks as CI:

```sh
CI=true pnpm check
```

Actual releases should happen from GitHub Actions on `main`.
