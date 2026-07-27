import nodemailer from "nodemailer";

/**
 * Comment notifications land in Dragos's inbox through his own Gmail
 * (app-password secret) — deliberately no third-party mail service, so
 * the processor list on /privacy doesn't grow. Sends are fire-and-forget
 * from the comment route: a mail outage must never fail a post.
 */

export type Mailer = {
  send(msg: { subject: string; text: string }): Promise<void>;
};

export function gmailMailer(
  user: string,
  pass: string,
  to: string = user,
): Mailer {
  // Default recipient is the sending account itself, so the notification
  // address lives only in the GMAIL_USER secret — never in source (the
  // repo may be public; a hardcoded personal address invites spam).
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return {
    async send(msg) {
      await transport.sendMail({ from: user, to, ...msg });
    },
  };
}

/** Harness stand-in: prints instead of sending. */
export function consoleMailer(): Mailer {
  return {
    async send(msg) {
      console.log(`[notify] ${msg.subject}\n${msg.text}`);
    },
  };
}
