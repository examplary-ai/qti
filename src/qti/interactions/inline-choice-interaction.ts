import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { QtiInteraction, QtiInteractionOptions } from "./interaction";
import { appendHtmlFragment } from "../../utils/html";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type InlineChoiceOptions = {
  identifier: string;
  fixed?: boolean;
  templateIdentifier?: string;
  content?: string;
};

export type InlineChoiceInteractionOptions = QtiInteractionOptions & {
  shuffle?: boolean;
  required?: boolean;
  inlineChoices?: InlineChoiceOptions[];
};

/**
 * Presents a dropdown menu embedded within text content for candidates to select an option.
 * Used for fill-in-the-blank style questions with predefined choices.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.8zaq47h31112
 *
 * @example
 * const interaction = new InlineChoiceInteraction({
 *   responseIdentifier: "RESPONSE",
 *   inlineChoices: [
 *     { identifier: "A", content: "is" },
 *     { identifier: "B", content: "are" },
 *   ],
 * });
 */
export class InlineChoiceInteraction extends QtiInteraction {
  public static tagName = "qti-inline-choice-interaction";

  public shuffle?: boolean;
  public required?: boolean;
  public inlineChoices?: InlineChoiceOptions[];

  constructor(options: InlineChoiceInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.required = options.required;
    this.inlineChoices = options.inlineChoices;
  }

  public static fromXmlString(xml: string): InlineChoiceInteraction {
    const inlineChoices: InlineChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-inline-choice-interaction");

    $("qti-inline-choice").each((_, node) => {
      const choice = $(node);
      inlineChoices.push({
        identifier: choice.attr("identifier")!,
        fixed: choice.attr("fixed") === "true",
        templateIdentifier: choice.attr("template-identifier"),
        content: (choice.html() || "").trim(),
      });
    });

    return new InlineChoiceInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      required: $root.attr("required") === "true",
      inlineChoices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-inline-choice-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      required: this.required ? "true" : undefined,
    });

    for (const choice of this.inlineChoices || []) {
      const choiceEl = item.ele(el("qti-inline-choice"), {
        identifier: choice.identifier,
        fixed: choice.fixed ? "true" : undefined,
        [attr("template-identifier")]: choice.templateIdentifier,
      });

      if (choice.content) {
        appendHtmlFragment(choice.content, choiceEl);
      }
    }

    return item;
  }
}
