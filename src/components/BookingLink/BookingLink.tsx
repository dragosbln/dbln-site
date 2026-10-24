"use client";

import type { MouseEvent, ReactNode } from "react";
import HashLink from "@/components/HashLink";
import type { BookingFormatValue } from "@/content/types";
import { requestBookingFormat } from "@/lib/bookingPrefill";
import { isModifiedClick } from "@/lib/isModifiedClick";

type BookingLinkProps = {
  /** The booking section, e.g. "/review#contact". */
  href: string;
  /** Selected in the booking picker when the click lands. */
  situation: BookingFormatValue;
  className?: string;
  children: ReactNode;
};

/**
 * A link to the booking section that also selects the visitor's situation
 * in its picker (the situation cards on /review). The situation travels
 * through `bookingPrefill`, not the URL: `BookingFlow` treats it as a pick,
 * which loads Cal.com, and only a click on this page may do that (see the
 * module comment there).
 *
 * Modified clicks (new tab or window) only navigate. The new tab loads the
 * page fresh, with no module state to receive the request, and this tab
 * must not act on it either: a booking section mounted here would switch
 * behind the visitor's back, and with none mounted the request would be
 * held for the next navigation in this tab, which the visitor never meant
 * to prefill.
 */
export default function BookingLink({
  href,
  situation,
  className,
  children,
}: BookingLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isModifiedClick(event)) requestBookingFormat(situation);
  };
  return (
    <HashLink className={className} href={href} onClick={handleClick}>
      {children}
    </HashLink>
  );
}
