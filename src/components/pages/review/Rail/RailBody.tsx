"use client";

import { useEffect, useRef, useState } from "react";
import ChevronIcon from "@/components/ChevronIcon";
import Reveal from "@/components/Reveal";
import type {
  RailGroups,
  RailReading,
  RailSection,
  RailStop,
} from "@/content/types";
import {
  RAIL_ALL_CLOSED,
  normaliseRailOpen,
  type RailOpenState,
  toggleRailBranch,
  toggleRailStop,
} from "@/lib/railOpen";
import RailIcon, { type RailIconName } from "./RailIcon";
import useFitChips from "./useFitChips";
import styles from "./Rail.module.css";

const READINGS: RailReading[] = ["happens", "example"];

const GROUP_ORDER: (keyof RailGroups)[] = ["need", "see", "rules", "checkpoint"];

const GROUP_ICON: Record<keyof RailGroups, RailIconName> = {
  need: "enter",
  see: "exit",
  rules: "warning",
  checkpoint: "flag",
};

/**
 * The branch forks off beside Stop 2 and Stop 3, so in the DOM (and on
 * phone, where the rail is one column) it sits between them.
 */
const STOPS_BEFORE_BRANCH = 3;

/** Below this the rail is one column and the branch sits inline (as the CSS). */
const PHONE_QUERY = "(max-width: 899px)";

type RailBodyProps = {
  content: RailSection;
};

/**
 * The rail's interactive body: the sticky reading switch and the rail with
 * its stops and branch. Both readings are always in the DOM (the page is a
 * crawler surface); the inactive one, and every closed panel, is `hidden`.
 */
export default function RailBody({ content }: RailBodyProps) {
  const { pre, stops, branch, post, groupLabels } = content;
  const [reading, setReading] = useState<RailReading>("happens");
  const [open, setOpen] = useState<RailOpenState>(RAIL_ALL_CLOSED);
  const [phone, setPhone] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useFitChips(railRef, styles.chip, [reading, open]);

  // The server cannot know the viewport, so the first render assumes
  // desktop on both sides (identical markup, no hydration mismatch) and the
  // real breakpoint is read after mount. Nothing renders differently by
  // breakpoint (the layout is CSS); `phone` only steers the toggle rules,
  // and every change re-applies the phone rule (src/lib/railOpen.ts) so a
  // stop and the branch are never both open on phone.
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    function syncBreakpoint() {
      const isPhone = query.matches;
      setPhone(isPhone);
      setOpen((prev) => normaliseRailOpen(prev, isPhone));
    }
    syncBreakpoint();
    query.addEventListener("change", syncBreakpoint);
    return () => query.removeEventListener("change", syncBreakpoint);
  }, []);

  function toggleStop(index: number) {
    setOpen((prev) => toggleRailStop(prev, index, phone));
  }

  function toggleBranch() {
    setOpen((prev) => toggleRailBranch(prev, phone));
  }

  function renderStop(stop: RailStop, index: number) {
    const isOpen = open.stop === index;
    const panelId = `rail-stop-${index}`;
    return (
      <li key={stop.label} className={`${styles.stop} ${styles[`s${index}`]}`}>
        <div className={styles.label}>
          <b>{stop.label}</b>
        </div>
        <div className={styles.cell}>
          <span
            className={isOpen ? `${styles.node} ${styles.nodeOpen}` : styles.node}
            aria-hidden="true"
          />
          <span className={styles.when}>{stop.when}</span>
          <button
            type="button"
            className={styles.hd}
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => toggleStop(index)}
          >
            <span className={styles.hdText}>
              <span className={styles.title}>{stop.title}</span>
              <span className={styles.sum} hidden={reading !== "happens"}>
                {stop.happens.summary}
              </span>
              <span className={styles.sum} hidden={reading !== "example"}>
                {stop.example.summary}
              </span>
            </span>
            <span className={styles.chev}>
              <ChevronIcon size={16} />
            </span>
          </button>
          <div id={panelId} className={styles.panel} hidden={!isOpen}>
            <div hidden={reading !== "happens"}>
              <p className={styles.prose}>{stop.happens.prose}</p>
              <ChipGroups groups={stop.happens.groups} labels={groupLabels} />
            </div>
            <div hidden={reading !== "example"}>
              {stop.example.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.ex}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <div className={styles.bar}>
        <div className="wrap">
          <div className={styles.barIn}>
            <span className={styles.barLabel}>{content.readingLabel}</span>
            <div
              className={styles.seg}
              role="group"
              aria-label={content.readingLabel}
            >
              {READINGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={styles.segButton}
                  aria-pressed={reading === value}
                  onClick={() => setReading(value)}
                >
                  {content.readings[value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className={styles.body} ref={railRef}>
          <Reveal as="ol" className={styles.grid}>
            <li className={styles.pre}>
              <div className={`${styles.cell} ${styles.dash}`}>
                <div hidden={reading !== "happens"}>
                  <p className={styles.kicker}>{pre.happens.kicker}</p>
                  <ul className={styles.triggers}>
                    {pre.happens.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div hidden={reading !== "example"}>
                  <p className={styles.exNote}>{pre.example.note}</p>
                  <p className={styles.kicker}>{pre.example.kicker}</p>
                  <ul className={styles.triggers}>
                    {pre.example.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>

            {stops.slice(0, STOPS_BEFORE_BRANCH).map(renderStop)}

            <li className={styles.branch}>
              <div className={styles.cell}>
                <div className={styles.bcard}>
                  <button
                    type="button"
                    className={styles.bhd}
                    aria-expanded={open.branch}
                    aria-controls="rail-branch"
                    onClick={toggleBranch}
                  >
                    <span className={styles.hdText}>
                      <span className={styles.meta}>
                        {branch.kicker}
                        <span
                          className={styles.metaTail}
                          hidden={reading !== "example"}
                        >
                          {branch.exampleKicker}
                        </span>
                      </span>
                      <span className={styles.title}>{branch.title}</span>
                      <span className={styles.bnote} hidden={reading !== "happens"}>
                        {branch.happens.note}
                      </span>
                      <span className={styles.bnote} hidden={reading !== "example"}>
                        {branch.example.note}
                      </span>
                    </span>
                    <span className={styles.chev}>
                      <ChevronIcon size={16} />
                    </span>
                  </button>
                  <div id="rail-branch" className={styles.bpanel} hidden={!open.branch}>
                    <div hidden={reading !== "happens"}>
                      <ChipGroups groups={branch.happens.groups} labels={groupLabels} />
                    </div>
                    <div hidden={reading !== "example"}>
                      {branch.example.paragraphs.map((paragraph) => (
                        <p key={paragraph} className={styles.ex}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
            {/* Desktop-only dashed connectors: rail to branch (beside stop 2)
                and branch back to rail (at stop 4). */}
            <li className={styles.fork} aria-hidden="true" />
            <li className={styles.rejoin} aria-hidden="true" />

            {stops
              .slice(STOPS_BEFORE_BRANCH)
              .map((stop, i) => renderStop(stop, i + STOPS_BEFORE_BRANCH))}

            <li className={styles.post}>
              <div className={`${styles.cell} ${styles.dash} ${styles.dashEnd}`}>
                <div hidden={reading !== "happens"}>
                  <p className={styles.kicker}>{post.happens.kicker}</p>
                  <ul className={styles.triggers}>
                    {post.happens.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className={styles.close}>{post.happens.close}</p>
                </div>
                <div hidden={reading !== "example"}>
                  <p className={styles.kicker}>{post.example.kicker}</p>
                  <ul className={styles.triggers}>
                    {post.example.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          </Reveal>
        </div>
      </div>
    </>
  );
}

type ChipGroupsProps = {
  groups: RailGroups;
  labels: RailSection["groupLabels"];
};

/** The four chip groups under an open stop (or the open branch). */
function ChipGroups({ groups, labels }: ChipGroupsProps) {
  return (
    <div className={styles.groups}>
      {GROUP_ORDER.map((key) => (
        <div key={key} className={styles[key]}>
          <p className={styles.groupLabel}>
            <RailIcon name={GROUP_ICON[key]} />
            {labels[key]}
          </p>
          <ul className={styles.chips}>
            {groups[key].map((chip) => (
              <li key={chip.text} className={styles.chip}>
                <RailIcon name={chip.icon} />
                <span>{chip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
