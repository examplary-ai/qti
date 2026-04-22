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

export type SimpleAssociableChoiceOptions = {
  identifier: string;
  matchMax?: number;
  matchMin?: number;
  matchGroup?: string;
  fixed?: boolean;
  templateIdentifier?: string;
  content?: string;
};

export type AssociateInteractionOptions = QtiPromptInteractionOptions & {
  shuffle?: boolean;
  minAssociations?: number;
  maxAssociations?: number;
  choices?: SimpleAssociableChoiceOptions[];
};

/**
 * Presents a set of choices for candidates to pair or associate with each other.
 * Unlike MatchInteraction, choices come from a single set and can be paired freely.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.7cs7637r54vv
 *
 * @example
 * const interaction = new AssociateInteraction({
 *   responseIdentifier: "RESPONSE",
 *   choices: [
 *     { identifier: "A", content: "Cat", matchMax: 1 },
 *     { identifier: "B", content: "Dog", matchMax: 1 },
 *     { identifier: "C", content: "Meow", matchMax: 1 },
 *     { identifier: "D", content: "Bark", matchMax: 1 },
 *   ],
 * });
 */
export class AssociateInteraction extends QtiPromptInteraction {
  public static tagName = "qti-associate-interaction";

  public shuffle?: boolean;
  public minAssociations?: number;
  public maxAssociations?: number;
  public choices?: SimpleAssociableChoiceOptions[];

  constructor(options: AssociateInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.minAssociations = options.minAssociations;
    this.maxAssociations = options.maxAssociations;
    this.choices = options.choices;
  }

  public static fromXmlString(xml: string): AssociateInteraction {
    const choices: SimpleAssociableChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-associate-interaction");

    $("qti-simple-associable-choice").each((_, node) => {
      const choice = $(node);
      choices.push({
        identifier: choice.attr("identifier")!,
        matchMax: choice.attr("match-max")
          ? Number(choice.attr("match-max"))
          : undefined,
        matchMin: choice.attr("match-min")
          ? Number(choice.attr("match-min"))
          : undefined,
        matchGroup: choice.attr("match-group"),
        fixed: choice.attr("fixed") === "true",
        templateIdentifier: choice.attr("template-identifier"),
        content: (choice.html() || "").trim(),
      });
    });

    return new AssociateInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      minAssociations: $root.attr("min-associations")
        ? Number($root.attr("min-associations"))
        : undefined,
      maxAssociations: $root.attr("max-associations")
        ? Number($root.attr("max-associations"))
        : undefined,
      choices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-associate-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      [attr("min-associations")]: this.minAssociations?.toString(),
      [attr("max-associations")]: this.maxAssociations?.toString(),
    });

    for (const choice of this.choices || []) {
      const choiceEl = item.ele(el("qti-simple-associable-choice"), {
        identifier: choice.identifier,
        [attr("match-max")]: choice.matchMax?.toString(),
        [attr("match-min")]: choice.matchMin?.toString(),
        [attr("match-group")]: choice.matchGroup,
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
