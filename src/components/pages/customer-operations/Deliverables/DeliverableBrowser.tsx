"use client";

import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type {
  CheckCaseKey,
  DeliverableKey,
  DeliverablesBrowser,
  RefText,
  XRef,
} from "@/content/types";
import ArchitectureDiagram from "./ArchitectureDiagram";
import styles from "./Deliverables.module.css";

/** Under this width the rows are an accordion (Deliverables.module.css). */
const PHONE = "(max-width: 600px)";

const panelId = (key: DeliverableKey) => `deliverable-${key}`;
const choiceId = (key: DeliverableKey) => `deliverable-${key}-choice`;

type DeliverableBrowserProps = { content: DeliverablesBrowser };

/**
 * The deliverable browser: one DOM for both layouts. Each deliverable is a
 * row of a picker button and its panel; on the desktop grid the buttons
 * stack in the left column and the open panel spans the right one, under
 * 600px each panel opens under its own button. Every panel is in the HTML,
 * toggled with `hidden` (the page is a crawler surface). Cross-references
 * in the excerpts open another deliverable, and a gate file in the checks
 * editor; the editor's file buttons switch the code and the failing run.
 */
export default function DeliverableBrowser({ content }: DeliverableBrowserProps) {
  const { items, checks } = content;
  const [selected, setSelected] = useState<DeliverableKey | null>(items[0].key);
  const [caseKey, setCaseKey] = useState<CheckCaseKey>(checks.cases[0].key);

  // On the phone the accordion may close entirely; back on the desktop
  // grid one panel must show, so an empty selection falls back to the first.
  useEffect(() => {
    const phone = window.matchMedia(PHONE);
    const onChange = () => {
      if (!phone.matches) setSelected((current) => current ?? items[0].key);
    };
    phone.addEventListener("change", onChange);
    return () => phone.removeEventListener("change", onChange);
  }, [items]);

  const choose = (key: DeliverableKey) => {
    const phone = window.matchMedia(PHONE).matches;
    setSelected((current) => (phone && current === key ? null : key));
  };

  // A cross-reference hides the panel its button sits in, which would drop
  // keyboard focus to <body>: hand it to the opened deliverable's picker
  // button once the panels have swapped (flushSync commits the swap first).
  // On the phone that row scrolls into view, as the reference does.
  const follow = (ref: XRef) => {
    flushSync(() => {
      setSelected(ref.go);
      if (ref.caseKey) setCaseKey(ref.caseKey);
    });
    const button = document.getElementById(choiceId(ref.go));
    if (window.matchMedia(PHONE).matches) {
      button?.scrollIntoView({ block: "start" });
    }
    button?.focus({ preventScroll: true });
  };

  const text = (parts: RefText): ReactNode =>
    parts.map((part, index) =>
      typeof part === "string" ? (
        part
      ) : (
        <button
          key={index}
          type="button"
          className={styles.xref}
          onClick={() => follow(part)}
        >
          {part.label}
        </button>
      ),
    );

  const rows = (list: { label: string; value: RefText }[]) =>
    list.map((row) => (
      <div key={row.label} className={styles.pair}>
        <dt>{row.label}</dt>
        <dd>{text(row.value)}</dd>
      </div>
    ));

  const currentCase =
    checks.cases.find((c) => c.key === caseKey) ?? checks.cases[0];

  const bodies: Record<DeliverableKey, ReactNode> = {
    summary: (
      <div className={`${styles.paper} ${styles.slide}`}>
        <p className={styles.label}>{content.summary.label}</p>
        <h4 className={styles.docTitle}>{content.summary.heading}</h4>
        <ul className={styles.summaryList}>
          {content.summary.bullets.map((bullet, index) => (
            <li key={index}>{text(bullet)}</li>
          ))}
        </ul>
        <div className={styles.slideBottom}>
          <p>{content.summary.bottom}</p>
        </div>
      </div>
    ),
    findings: (
      <div className={styles.paper}>
        <p className={styles.label}>{content.findings.label}</p>
        <h4 className={styles.docTitle}>{content.findings.heading}</h4>
        <p>{content.findings.body}</p>
        <dl className={styles.evidence}>{rows(content.findings.evidence)}</dl>
      </div>
    ),
    design: (
      <div className={styles.paper}>
        <p className={styles.label}>{content.design.label}</p>
        <h4 className={styles.docTitle}>{content.design.heading}</h4>
        <p>{content.design.body}</p>
        <div className={styles.designColumns}>
          <dl className={`${styles.evidence} ${styles.evidenceStack}`}>
            {rows(content.design.columns)}
          </dl>
          <ArchitectureDiagram labels={content.design.diagram} />
        </div>
      </div>
    ),
    roadmap: (
      <div className={styles.paper}>
        <ol className={styles.roadmap}>
          <li>
            <div className={styles.roadmapStep}>
              <p className={styles.label}>{content.roadmap.step.label}</p>
              <h4 className={`${styles.docTitle} ${styles.roadmapHeading}`}>
                {content.roadmap.step.heading}
              </h4>
              <div className={styles.roadmapBody}>
                <p>{content.roadmap.step.body}</p>
                <dl className={styles.evidence}>
                  {rows(content.roadmap.step.meta)}
                </dl>
              </div>
            </div>
          </li>
          {content.roadmap.next.map((item) => (
            <li key={item}>
              <p className={styles.roadmapNext}>{item}</p>
            </li>
          ))}
        </ol>
      </div>
    ),
    checks: (
      <>
        <div className={styles.editor}>
          <div className={styles.workspace}>
            <div
              className={styles.files}
              role="group"
              aria-label={checks.filesLabel}
            >
              <div className={styles.folder}>{checks.folders.gates}</div>
              {checks.cases.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={styles.file}
                  aria-pressed={c.key === caseKey}
                  onClick={() => setCaseKey(c.key)}
                >
                  {c.filename}
                </button>
              ))}
              <div className={styles.fileSupport}>
                <div className={styles.folder}>{checks.folders.regression}</div>
                {checks.regression.map((file) => (
                  <span key={file} className={styles.fileStatic}>
                    {file}
                  </span>
                ))}
                <div className={styles.folder}>{checks.folders.fixtures}</div>
                {checks.fixtures.map((file) => (
                  <span key={file} className={styles.fileStatic}>
                    {file}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.codeArea}>
              <div className={styles.openFile}>
                {checks.openPrefix}
                {currentCase.filename}
              </div>
              {checks.cases.map((c) => (
                <pre
                  key={c.key}
                  className={styles.code}
                  hidden={c.key !== caseKey}
                >
                  {c.lines.map((line, index) => (
                    <span
                      key={index}
                      className={line.tone ? styles[line.tone] : undefined}
                    >
                      {line.text}
                      {index < c.lines.length - 1 ? "\n" : ""}
                    </span>
                  ))}
                </pre>
              ))}
            </div>
          </div>
          <div className={styles.terminal}>
            <div className={styles.command}>{checks.terminal.command}</div>
            {checks.terminal.runs.map((run, index) => (
              <div key={index} className={styles.runLine}>
                <span className={run.status === "pass" ? styles.pass : styles.fail}>
                  {run.status.toUpperCase()}
                </span>
                <span>{run.text}</span>
              </div>
            ))}
            {checks.cases.map((c) => (
              <div
                key={c.key}
                className={styles.failureDetail}
                hidden={c.key !== caseKey}
              >
                <strong>{c.failure}</strong>
                <br />
                {c.expected}
              </div>
            ))}
          </div>
        </div>
        <p className={styles.checkNote}>{checks.note}</p>
      </>
    ),
  };

  return (
    <div
      className={styles.browser}
      role="group"
      aria-label={content.pickerLabel}
    >
      {items.map((item) => {
        const open = selected === item.key;
        return (
          <div key={item.key} className={styles.row}>
            <button
              type="button"
              id={choiceId(item.key)}
              className={styles.choice}
              aria-expanded={open}
              aria-controls={panelId(item.key)}
              onClick={() => choose(item.key)}
            >
              <span className={styles.choiceTitle}>
                {item.navTitle ?? item.title}
              </span>
              <span className={styles.format}>{item.format}</span>
            </button>
            <div id={panelId(item.key)} className={styles.panel} hidden={!open}>
              <header className={styles.paneHead}>
                <h3 className={styles.paneTitle}>{item.title}</h3>
                <p className={styles.purpose}>{item.purpose}</p>
              </header>
              {bodies[item.key]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
