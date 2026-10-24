import { Fragment, type ReactNode } from "react";
import type {
  DocBlock,
  DocCodeToken,
  DocTableCell,
  DocTableColumn,
  SampleDocument,
} from "@/content/types";
import { richText } from "@/lib/richText";
import styles from "./DocumentPage.module.css";

type DocumentPageProps = {
  document: SampleDocument;
  className?: string;
};

/**
 * One sample document as a paper page: the title, its blocks, the page
 * footer. The design is `.wy-pg` in the review handover's
 * 03-what-you-get.dc.html. The page's own heading is an h3 and finding
 * titles are h4, because the page sits under the section's h2.
 */
export default function DocumentPage({ document, className }: DocumentPageProps) {
  return (
    <div className={className ? `${styles.page} ${className}` : styles.page}>
      <h3>{document.title}</h3>
      {renderBlocks(document.blocks)}
      {document.foot ? (
        <div className={styles.foot}>
          <span>{document.foot.left}</span>
          <span>{document.foot.right}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Blocks key by position: they have no identity of their own, never
 * reorder, and one page can repeat a block (two "Finding" kickers).
 */
function renderBlocks(blocks: DocBlock[]): ReactNode {
  return blocks.map((block, index) => <Block key={index} block={block} />);
}

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "kicker":
      return <p className={styles.kicker}>{block.text}</p>;
    case "meta":
      return <p className={styles.meta}>{block.text}</p>;
    case "p":
      return <p className={styles.para}>{richText(block.text)}</p>;
    case "quote":
      return <p className={styles.quote}>{block.text}</p>;
    case "answer":
      return <p className={styles.answer}>{richText(block.text)}</p>;
    case "table":
      return <DocTable columns={block.columns} rows={block.rows} />;
    case "ol":
      return (
        <ol className={styles.ol}>
          {block.items.map((item) => (
            <li key={item}>{richText(item)}</li>
          ))}
        </ol>
      );
    case "ul":
      return (
        <ul className={styles.ul}>
          {block.items.map((item) => (
            <li key={item}>{richText(item)}</li>
          ))}
        </ul>
      );
    case "kv": {
      const list = (
        <dl className={block.boxed ? undefined : styles.kv}>
          {block.rows.map((row) => (
            <Fragment key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {row.mono ? (
                  <span className={styles.mono}>{richText(row.value)}</span>
                ) : (
                  richText(row.value)
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      );
      return block.boxed ? <div className={styles.box}>{list}</div> : list;
    }
    case "finding":
      return (
        <div className={styles.finding}>
          <span className={styles.findingId}>{block.id}</span>
          {block.title ? <h4>{block.title}</h4> : null}
          {renderBlocks(block.blocks)}
        </div>
      );
    case "code":
      return <CodeBlock lines={block.lines} />;
  }
}

/**
 * The column, not the cell, sets the face: mono for ids and days, the wide
 * sans column that must not collapse ("Change"), sans for the rest.
 */
function cellClass(column: DocTableColumn): string {
  if (column.wide) return styles.wide;
  return column.mono ? styles.mono : styles.sans;
}

function cellText(cell: DocTableCell): string {
  return typeof cell === "string" ? cell : `${cell.id} ${cell.text}`;
}

/**
 * Under 640px the rows stack and every cell prints its column label
 * (`data-label`, read by the CSS), so the header row can hide.
 */
function DocTable({
  columns,
  rows,
}: {
  columns: DocTableColumn[];
  rows: DocTableCell[][];
}) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.label} scope="col">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.map(cellText).join("|")}>
            {row.map((cell, index) => {
              const column = columns[index];
              return (
                <td
                  key={column.label}
                  className={cellClass(column)}
                  data-label={column.label}
                >
                  {typeof cell === "string" ? (
                    cell
                  ) : (
                    <>
                      <b>{cell.id}</b> {cell.text}
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One span per toned token, plain text between, a newline between lines;
 * the `<pre>` keeps the indentation. Lines and tokens key by position: the
 * same token ("  ", a number) repeats within a block.
 */
function CodeBlock({ lines }: { lines: DocCodeToken[][] }) {
  return (
    <pre className={styles.code}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? "\n" : null}
          {line.map((token, tokenIndex) =>
            typeof token === "string" ? (
              <Fragment key={tokenIndex}>{token}</Fragment>
            ) : (
              <span key={tokenIndex} className={styles[token.tone]}>
                {token.text}
              </span>
            ),
          )}
        </Fragment>
      ))}
    </pre>
  );
}
