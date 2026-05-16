import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { SimpleChoiceOptions } from "./choice-interaction";
import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { appendHtmlFragment } from "../../utils/html";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type OrderInteractionOptions = QtiPromptInteractionOptions & {
  shuffle?: boolean;
  minChoices?: number;
  maxChoices?: number;
  orientation?: "horizontal" | "vertical";
  choices?: SimpleChoiceOptions[];
};

/**
 * Presents a set of choices for candidates to arrange in a specific order or sequence.
 * Used for ranking, sequencing, or prioritization questions.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.4n8gips6tlv4
 *
 * @example
 * const interaction = new OrderInteraction({
 *   responseIdentifier: "RESPONSE",
 *   choices: [
 *     { identifier: "A", content: "First step" },
 *     { identifier: "B", content: "Second step" },
 *     { identifier: "C", content: "Third step" },
 *   ],
 * });
 */
export class OrderInteraction extends QtiPromptInteraction {
  public static tagName = "qti-order-interaction";

  public shuffle?: boolean;
  public minChoices?: number;
  public maxChoices?: number;
  public orientation?: "horizontal" | "vertical";
  public choices?: SimpleChoiceOptions[];

  constructor(options: OrderInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.minChoices = options.minChoices;
    this.maxChoices = options.maxChoices;
    this.orientation = options.orientation;
    this.choices = options.choices;
  }

  public static fromXmlString(xml: string): OrderInteraction {
    const $ = load(xml, { xmlMode: true });
    let $root = $("qti-order-interaction");
    let version = QtiVersion.v3p0;
    if (!$root.length) {
      $root = $("orderInteraction");
      version = QtiVersion.v2p1;
    }
    const attr = (name: string) => $root.attr(toAttributeName(name, version));

    const choices: SimpleChoiceOptions[] = [];
    $(toElementName("qti-simple-choice", version)).each((_, node) => {
      const choice = $(node);
      choices.push({
        identifier: choice.attr("identifier")!,
        fixed: choice.attr("fixed") === "true",
        templateIdentifier: choice.attr(
          toAttributeName("template-identifier", version),
        ),
        label: choice.attr("label"),
        content: (choice.html() || "").trim(),
      });
    });

    return new OrderInteraction({
      responseIdentifier: attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      minChoices: attr("min-choices") ? Number(attr("min-choices")) : undefined,
      maxChoices: attr("max-choices") ? Number(attr("max-choices")) : undefined,
      orientation: $root.attr("orientation") as "horizontal" | "vertical",
      choices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-order-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      [attr("min-choices")]: this.minChoices?.toString(),
      [attr("max-choices")]: this.maxChoices?.toString(),
      orientation: this.orientation,
    });

    for (const choice of this.choices || []) {
      const choiceEl = item.ele(el("qti-simple-choice"), {
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
