import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { QtiInteraction, QtiInteractionOptions } from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type EndAttemptInteractionOptions = QtiInteractionOptions & {
  title: string;
  countAttempt?: boolean;
};

/**
 * Presents a button that allows candidates to voluntarily end their assessment attempt.
 * Used for "give up" or "submit early" functionality in adaptive testing scenarios.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.b3g8rgbtuwqp
 *
 * @example
 * const interaction = new EndAttemptInteraction({
 *   responseIdentifier: "RESPONSE",
 *   title: "Give Up",
 *   countAttempt: true,
 * });
 */
export class EndAttemptInteraction extends QtiInteraction {
  public static tagName = "qti-end-attempt-interaction";
  public static inline = true;

  public title: string;
  public countAttempt?: boolean;

  constructor(options: EndAttemptInteractionOptions) {
    super(options);

    this.title = options.title;
    this.countAttempt = options.countAttempt;
  }

  public static fromXmlString(xml: string): EndAttemptInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-end-attempt-interaction");

    return new EndAttemptInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      title: $root.attr("title")!,
      countAttempt: $root.attr("count-attempt") === "true",
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-end-attempt-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      title: this.title,
      [attr("count-attempt")]: this.countAttempt ? "true" : undefined,
    });

    return item;
  }
}
