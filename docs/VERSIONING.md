# Versioning Guide

This guide explains how versioning is managed in our project based on conventional commits. We follow automated workflows to determine version increments based on the types of commits made.

## Conventional Commits

We utilize the Conventional Commits specification to provide a standardized format for commit messages. The format consists of a type, an optional scope, and a subject, separated by colons. Examples of commit message formats include:

- `feat: add user authentication functionality`
- `fix(api): resolve issue with data retrieval`

For further details on how to write your commits please see the [Contributing Guide](../contributing.md#commit-header).
For more information about the Conventional Commits specification, refer to the [official specification](https://www.conventionalcommits.org/en/v1.0.0/).

## Versioning Workflow

Our versioning workflow is designed to automate the version increment process based on commit types. We use the following rules:

1. **Fixes** (prefix: `fix`): Commits with the `fix` prefix indicate bug fixes. These commits trigger a **patch** increment (e.g., from `1.2.3` to `1.2.4`).

2. **Features** (prefix: `feat`): Commits with the `feat` prefix indicate new features. These commits trigger a **minor** increment (e.g., from `1.2.3` to `1.3.0`).

3. **Breaking Changes** (prefix: `BREAKING CHANGE`): Commits that introduce breaking changes trigger a **major** increment (e.g., from `1.2.3` to `2.0.0`).

This process follows the [Semantic Versioning](https://semver.org/) guidelines. For further details on how to write your commits please see the [Contributing Guide](../contributing.md#commit-header).

## Automated Versioning

To automate the versioning process, we utilize continuous integration (CI) and build tools. Whenever changes are pushed to the main branch or a release branch, our CI pipeline analyzes the commit history and determines the appropriate version increment based on the conventional commits.

The automated versioning workflow includes the following steps:

1. Analyze the commit history since the last release.
2. Determine the highest impact of commits (major, minor, or patch).
3. Increment the version number based on the determined impact.
4. Generate and tag a new release using the updated version number.

By automating the versioning process, we ensure consistent and accurate version increments based on the nature of the changes.


## Release Process

Our release process involves creating release branches, which are used to prepare a stable version for deployment. Once the changes are ready, a release branch is merged into the main branch, triggering the automated versioning workflow and generating a new release. This process follows the Gitflow Workflow (for further details check our [Contributing Guide](../CONTRIBUTING.MD#gitflow-workflow)).

It's important to note that our versioning process also takes into account any manual overrides or specific release requirements defined by the project team.

---

This versioning guide provides an overview of our versioning workflow based on conventional commits, git workflow, and the automated processes we follow. By leveraging automated versioning, we ensure consistent version increments and simplify the release process, resulting in more efficient development and reliable software releases.
