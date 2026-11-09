import { Link, makeStyles, tokens } from '@fluentui/react-components'
import { groupItemLines, splitItem, tokenizeInline, type InlineToken } from './inlineMarkdown'

export interface ChangelogItemProps {
  readonly item: string
  readonly onOpenLink: (url: string) => void
}

const useStyles = makeStyles({
  item: {
    marginBottom: tokens.spacingVerticalXS,
    lineHeight: tokens.lineHeightBase300,
    overflowWrap: 'anywhere'
  },
  code: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '0.9em',
    padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3
  },
  nested: {
    margin: `${tokens.spacingVerticalXXS} 0 0`,
    paddingLeft: tokens.spacingHorizontalXL
  },
  subheading: {
    marginTop: tokens.spacingVerticalS,
    fontWeight: tokens.fontWeightSemibold
  },
  prose: {
    marginTop: tokens.spacingVerticalXXS,
    color: tokens.colorNeutralForeground2
  }
})

interface InlineTextProps {
  readonly tokens: InlineToken[]
  readonly onOpenLink: (url: string) => void
}

function InlineText(props: InlineTextProps): React.JSX.Element {
  const styles = useStyles()

  return (
    <>
      {props.tokens.map((token, index) => {
        // Tokens have no identity of their own and the list never reorders, so the position is a
        // stable key.
        const key = `${token.kind}-${index}`
        switch (token.kind) {
          case 'text':
            return <span key={key}>{token.value}</span>
          case 'code':
            return (
              <code key={key} className={styles.code}>
                {token.value}
              </code>
            )
          case 'bold':
            return (
              <strong key={key}>
                <InlineText tokens={token.children} onOpenLink={props.onOpenLink} />
              </strong>
            )
          case 'link':
            return (
              <Link key={key} inline onClick={() => props.onOpenLink(token.href)}>
                {token.label}
              </Link>
            )
        }
      })}
    </>
  )
}

/**
 * One bullet of a release's notes: its own text, then any nested bullets, sub-headings and prose
 * the parser kept beneath it. Rendered as React nodes only, never as HTML.
 */
export function ChangelogItem(props: ChangelogItemProps): React.JSX.Element {
  const styles = useStyles()
  const { text, lines } = splitItem(props.item)

  return (
    <li className={styles.item}>
      <InlineText tokens={tokenizeInline(text)} onOpenLink={props.onOpenLink} />
      {groupItemLines(lines).map((block, index) => {
        const key = `${block.kind}-${index}`
        if (block.kind === 'bullets') {
          return (
            <ul key={key} className={styles.nested}>
              {block.items.map((nested, nestedIndex) => (
                <li key={`${key}-${nestedIndex}`} className={styles.item}>
                  <InlineText tokens={tokenizeInline(nested)} onOpenLink={props.onOpenLink} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <div key={key} className={block.kind === 'heading' ? styles.subheading : styles.prose}>
            <InlineText tokens={tokenizeInline(block.text)} onOpenLink={props.onOpenLink} />
          </div>
        )
      })}
    </li>
  )
}
