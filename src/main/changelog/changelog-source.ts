import changelogText from '../../../CHANGELOG.md?raw'

/**
 * The repository's `CHANGELOG.md`, compiled into the main bundle at build time. The file itself
 * is excluded from the packaged app (`electron-builder.yml`), and a `?raw` import needs no
 * filesystem access at runtime, so the text always matches the build it shipped in.
 *
 * This is the only module that imports the file. Everything else takes the text as a string, so
 * the parser in `src/main/services/changelog` stays free of build tooling and testable with plain
 * fixtures.
 */
export function getChangelogSource(): string {
  return changelogText
}
