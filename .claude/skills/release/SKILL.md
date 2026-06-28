---
name: release
description: Prepare the current branch for the next release
---

## Compare current branch against the last release

!`git log <last_release_tag>..HEAD --oneline`

## Instructions

Prepare the current branch for the next release, following the latest Keep a Changelog guidelines, you are to assume the following:

- All work up to the moment of triggering release preparation has been completed and committed to the branch currently checked out.
- All invocation of this skill are to be treated as a brand new release preparation request. Do not assume any prior context or information from previous requests.

With that in mind, here are the steps you should take to prepare for a release:

- **Changelog update**: Review the commit history since the last release and update the changelog file located at `CHANGELOG.md` accordingly. Ensure that all new features, bug fixes, and other changes are clearly documented in the changelog. Should there be any breaking changes, clearly indicate them in the changelog, and provide workaround instructions if necessary.
- **Version bump**: Determine the appropriate version number for the new release based on the changes made since the last release. Update the version number in relevant files `package.json` and `package-lock.json` accordingly.
- **Documentation update**: Ensure that all relevant documentation is up to date, including project main README files, API documentation, and any other project-related documentation.
- **Reset Active Context**: After preparing the release, compress, or reset the active context to ensure that the next development cycle starts with a clean slate.
