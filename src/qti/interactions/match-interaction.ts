import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { SimpleAssociableChoiceOptions } from "./associate-interaction";
import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { appendHtmlFragment } from "../../utils/html";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type MatchInteractionOptions = QtiPromptInteractionOptions & {
  shuffle?: boolean;
  minAssociations?: number;
  maxAssociations?: number;
  sourceChoices?: SimpleAssociableChoiceOptions[];
  targetChoices?: SimpleAssociableChoiceOptions[];
};

/**
 * Presents two sets of choices for candidates to match or associate with each other.
 * Commonly used for matching terms with definitions or pairing related concepts.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.be4ll1tm4t99
 *
 * @example
 * const interaction = new MatchInteraction({
 *   responseIdentifier: "RESPONSE",
 *   sourceChoices: [
 *     { identifier: "S1", content: "Paris", matchMax: 1 },
 *     { identifier: "S2", content: "London", matchMax: 1 },
 *   ],
 *   targetChoices: [
 *     { identifier: "T1", content: "France", matchMax: 1 },
 *     { identifier: "T2", content: "England", matchMax: 1 },
 *   ],
 * });
 */
export class MatchInteraction extends QtiPromptInteraction {
  public static tagName = "qti-match-interaction";

  public shuffle?: boolean;
  public minAssociations?: number;
  public maxAssociations?: number;
  public sourceChoices?: SimpleAssociableChoiceOptions[];
  public targetChoices?: SimpleAssociableChoiceOptions[];

  constructor(options: MatchInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.minAssociations = options.minAssociations;
    this.maxAssociations = options.maxAssociations;
    this.sourceChoices = options.sourceChoices;
    this.targetChoices = options.targetChoices;
  }

  public static fromXmlString(xml: string): MatchInteraction {
    const sourceChoices: SimpleAssociableChoiceOptions[] = [];
    const targetChoices: SimpleAssociableChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-match-interaction");
    const $matchSets = $root.find("qti-simple-match-set");

    $matchSets.each((index, matchSet) => {
      const choices = index === 0 ? sourceChoices : targetChoices;
      $(matchSet)
        .find("qti-simple-associable-choice")
        .each((_, node) => {
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
    });

    return new MatchInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      minAssociations: $root.attr("min-associations")
        ? Number($root.attr("min-associations"))
        : undefined,
      maxAssociations: $root.attr("max-associations")
        ? Number($root.attr("max-associations"))
        : undefined,
      sourceChoices,
      targetChoices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-match-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      [attr("min-associations")]: this.minAssociations?.toString(),
      [attr("max-associations")]: this.maxAssociations?.toString(),
    });

    const sourceSet = item.ele(el("qti-simple-match-set"));
    for (const choice of this.sourceChoices || []) {
      const choiceEl = sourceSet.ele(el("qti-simple-associable-choice"), {
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

    const targetSet = item.ele(el("qti-simple-match-set"));
    for (const choice of this.targetChoices || []) {
      const choiceEl = targetSet.ele(el("qti-simple-associable-choice"), {
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
