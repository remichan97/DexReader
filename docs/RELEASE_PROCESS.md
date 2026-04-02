# Release Process

> **Audience**: This document is for project maintainers managing releases. Contributors do not need to follow this process.

DexReader follows semantic versioning (MAJOR.MINOR.PATCH) and uses an automated release pipeline via GitHub Actions.

## Table of Contents

- [Version Numbering](#version-numbering)
- [Normal Release Workflow](#normal-release-workflow)
- [Hotfix Workflow](#hotfix-workflow-critical-issues)
- [Pre-releases](#pre-releases-optional)
- [Why Not Delete Bad Releases](#why-not-delete-bad-releases)

## Version Numbering

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major UI overhaul
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## Normal Release Workflow

### 1. Prepare Release

Bump version in package.json:

```bash
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.0 → 1.1.0
# or
npm version major  # 1.0.0 → 2.0.0
```

### 2. Update CHANGELOG.md

Add a new section at the top following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.0.1] - 2026-04-03

### Fixed

- Fix critical bug in chapter download
- Correct reading progress tracking

### Added

- Add keyboard shortcut for bookmarking

### Changed

- Improve download queue performance

### Deprecated

- Old API endpoints (will be removed in v2.0.0)

### Removed

- Unused legacy code

### Security

- Fix XSS vulnerability in manga title display
```

**Version format**: Use version **without** 'v' prefix in CHANGELOG.md (e.g., `## [1.0.1]`)

### 3. Commit and Tag

```bash
# Commit version bump and changelog
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.1"

# Push to main
git push origin main

# Create and push tag
git tag v1.0.1
git push origin v1.0.1
```

### 4. Automated Build

Pushing the tag triggers the `.github/workflows/release.yaml` workflow which automatically:

1. ✅ Creates GitHub Release with changelog extracted from CHANGELOG.md
2. ✅ Builds installers for Windows, macOS (x64 + arm64), Linux
3. ✅ Uploads installers to the release:
   - Windows: `dexreader-1.0.1-setup.exe`
   - macOS: `dexreader-1.0.1-x64.dmg`, `dexreader-1.0.1-arm64.dmg`
   - Linux: `dexreader-1.0.1-x64.AppImage`, `.snap`, `.deb`
4. ✅ Generates update metadata files for electron-updater:
   - `latest.yml` (Windows)
   - `latest-mac.yml` (macOS)
   - `latest-linux.yml` (Linux)

### 5. Verify Release

1. Check GitHub Actions: `https://github.com/remichan97/DexReader/actions`
2. Verify all 3 platforms built successfully
3. Check GitHub Release has all installers
4. Test download and install on at least one platform

## Hotfix Workflow (Critical Issues)

If a critical bug is discovered after release, use the **yank + hotfix** approach for transparency.

### Why Yank + Hotfix?

**✅ Transparent approach:**

- Shows issue was acknowledged and fixed quickly
- Release history provides audit trail
- Builds trust with users

**❌ Don't delete releases:**

- Users who already downloaded will be confused
- Looks like hiding mistakes
- No upgrade path for affected users

### Steps

#### 1. Mark Bad Release

On GitHub, edit the problematic release (e.g., v1.0.0):

- ✅ Check "This is a pre-release" (hides from "Latest Release")
- ✅ Add warning to description:

  ```
  ⚠️ **DO NOT USE THIS VERSION**

  Critical bug discovered: [describe issue]

  Please download v1.0.1 instead: [link to new release]
  ```

#### 2. Create Hotfix Branch

```bash
git checkout main
git checkout -b hotfix/v1.0.1
```

#### 3. Fix the Issue

```bash
# Make your fixes
git add .
git commit -m "fix: <describe critical issue>"

# Example:
# git commit -m "fix: prevent data loss on chapter download cancel"
```

#### 4. Bump Version

```bash
# Edit package.json: bump patch version (1.0.0 → 1.0.1)
# Edit CHANGELOG.md: add [1.0.1] section with fix details

git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.1 (hotfix)"
```

Example CHANGELOG entry:

```markdown
## [1.0.1] - 2026-04-03

### Fixed

- **Critical**: Fix data loss when canceling chapter downloads
- Users on v1.0.0 should update immediately

## [1.0.0] - 2026-04-02

⚠️ **This version has a critical bug. Please use v1.0.1 instead.**

- Initial release
```

#### 5. Merge and Release

```bash
# Merge back to main
git checkout main
git merge hotfix/v1.0.1 --no-ff

# Push main
git push origin main

# Create and push tag
git tag v1.0.1
git push origin v1.0.1

# Cleanup hotfix branch
git branch -d hotfix/v1.0.1
```

#### 6. Communication Strategy

**Automatic updates:**

- Users on v1.0.0 will receive update notification
- electron-updater automatically downloads and installs v1.0.1
- No manual intervention needed for existing users

**New downloads:**

- GitHub shows v1.0.1 as "Latest Release"
- v1.0.0 marked as "Pre-release" (less visible)
- Download page guides users to correct version

**Optional (for major issues):**

- Post announcement in GitHub Discussions
- Update README.md with notice (if needed)

## Pre-releases (Optional)

For beta testing before official release:

### Creating a Pre-release

```bash
# Tag with pre-release suffix
git tag v1.1.0-beta.1
git push origin v1.1.0-beta.1
```

This triggers the release workflow, but you need to manually mark it as pre-release on GitHub:

1. Go to the created release
2. Edit release
3. ✅ Check "This is a pre-release"
4. Add beta testing instructions in description

### Pre-release Versioning

- `v1.1.0-alpha.1` - Early internal testing
- `v1.1.0-beta.1` - External beta testing
- `v1.1.0-rc.1` - Release candidate (final testing)
- `v1.1.0` - Stable release

### Promoting to Stable

When pre-release is ready:

```bash
# Create stable tag
git tag v1.1.0
git push origin v1.1.0

# Mark as stable release on GitHub
# Uncheck "This is a pre-release"
```

## Why Not Delete Bad Releases?

**Immutability is better than deletion:**

| Yank + Hotfix ✅   | Delete + Redo ❌                  |
| ------------------ | --------------------------------- |
| Users see the fix  | Users confused by missing release |
| Auto-update works  | No upgrade path                   |
| Shows transparency | Looks suspicious                  |
| Audit trail        | History lost                      |
| Professional       | Looks amateurish                  |

**GitHub also enforces immutable tags** by default, so deletion requires force-pushing which is discouraged.

## Testing Releases

### Manual Build Testing

Test builds without creating a release using the manual workflow:

1. Go to Actions → Build
2. Click "Run workflow"
3. Select branch
4. Download artifacts from workflow run

This builds all platforms without creating a GitHub Release or tagging.

### Local Build Testing

Test on your own machine:

```bash
# Windows (on Windows machine)
npm run build:win

# macOS (on macOS machine)
npm run build:mac

# Linux (on Linux or WSL)
npm run build:linux
```

Outputs will be in `dist/` folder.

## Troubleshooting

### Release Workflow Failed

1. Check GitHub Actions logs for error
2. Common issues:
   - Missing CHANGELOG.md entry for version
   - CHANGELOG format incorrect (must be `## [X.Y.Z]` without 'v')
   - Build failure on specific platform
   - Permission issues (needs `contents: write`)

### Changelog Not Extracted

The workflow extracts changelog using this pattern:

```bash
# Looks for: ## [1.0.1]
# Extracts everything until next ## [ section
```

**Requirements:**

- Version in CHANGELOG matches tag (without 'v')
- Use exact format: `## [1.0.1] - 2026-04-03`
- Have content between version sections

### Build Only One Platform Failed

The matrix uses `fail-fast: false`, so:

- Other platforms continue building
- Failed platform can be manually rebuilt
- Or push hotfix tag to retry all platforms

---

**Last Updated**: 3 April 2026
