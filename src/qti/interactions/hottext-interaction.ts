import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { appendHtmlFragment } from "../../utils/html";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type HottextInteractionOptions = QtiPromptInteractionOptions & {
  minChoices?: number;
  maxChoices?: number;
  content?: string;
};

/**
 * Presents text with selectable words or phrases (hottext) for candidates to choose.
 * Used for questions where candidates identify specific parts of a text passage.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.sbnpx830yzqu
 *
 * @example
 * const interaction = new HottextInteraction({
 *   responseIdentifier: "RESPONSE",
 *   maxChoices: 1,
 *   content: "<p>Select the <qti-hottext identifier='A'>noun</qti-hottext> in: The <qti-hottext identifier='B'>cat</qti-hottext> sat.</p>",
 * });
 */
export class HottextInteraction extends QtiPromptInteraction {
  public static tagName = "qti-hottext-interaction";

  public minChoices?: number;
  public maxChoices?: number;
  public content?: string;

  constructor(options: HottextInteractionOptions) {
    super(options);

    this.minChoices = options.minChoices;
    this.maxChoices = options.maxChoices;
    this.content = options.content;
  }

  public static fromXmlString(xml: string): HottextInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-hottext-interaction");
    const content = ($root.html() || "").trim();

    return new HottextInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      minChoices: $root.attr("min-choices")
        ? Number($root.attr("min-choices"))
        : undefined,
      maxChoices: $root.attr("max-choices")
        ? Number($root.attr("max-choices"))
        : undefined,
      content: content || undefined,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-hottext-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("min-choices")]: this.minChoices?.toString(),
      [attr("max-choices")]: this.maxChoices?.toString(),
    });

    if (this.content) {
      appendHtmlFragment(this.content, item);
    }

    return item;
  }
}
