# Release

This project releases from `main` with GitHub Actions, release-please, and npm Trusted Publishing.

## Bootstrap Status

The first package version was published manually:

- npm package: `satteri-stream@0.1.0`
- npm dist-tag: `latest -> 0.1.0`
- Git tag: `v0.1.0`
- GitHub release: `v0.1.0`

This manual bootstrap is only needed once. Future package releases should be created by the GitHub Actions release workflow.

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
- Environment: leave empty unless the workflow later adds a GitHub Actions environment

The workflow grants:

```yaml
permissions:
  contents: write
  id-token: write
```

`id-token: write` lets npm exchange GitHub's OIDC identity for a short-lived publish credential. The repository should be public for npm provenance.

## Normal Release Flow

1. Commit changes on `dev` using Conventional Commits.
2. Open a pull request from `dev` into `main`.
3. Merge the pull request after the required CI check passes.
4. The `Release` workflow runs on `main`.
5. release-please opens or updates a release PR when `main` contains releasable commits.
6. Merge the release PR.
7. GitHub Actions creates the GitHub release and publishes the package to npm through Trusted Publishing.

## Local Checks

Run the same deterministic checks as CI:

```sh
CI=true pnpm check
```

Actual releases should happen from GitHub Actions on `main`.
