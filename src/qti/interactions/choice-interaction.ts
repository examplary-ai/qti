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

export type SimpleChoiceOptions = {
  identifier: string;
  fixed?: boolean;
  templateIdentifier?: string;
  label?: string;
  content?: string;
};

export type ChoiceInteractionOptions = QtiPromptInteractionOptions & {
  shuffle?: boolean;
  maxChoices?: number;
  minChoices?: number;
  orientation?: "horizontal" | "vertical";
  minSelectionsMessage?: string;
  maxSelectionsMessage?: string;
  choices?: SimpleChoiceOptions[];
};

/**
 * Presents a set of choices for candidates to select one or more options.
 * Supports single-select (radio) or multi-select (checkbox) modes via maxChoices.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.j9nu1oa1tu3b
 *
 * @example
 * const interaction = new ChoiceInteraction({
 *   responseIdentifier: "RESPONSE",
 *   maxChoices: 1,
 *   choices: [
 *     { identifier: "A", content: "Option A" },
 *     { identifier: "B", content: "Option B" },
 *   ],
 * });
 */
export class ChoiceInteraction extends QtiPromptInteraction {
  public static tagName = "qti-choice-interaction";

  public choices?: SimpleChoiceOptions[];
  public shuffle?: boolean;
  public maxChoices?: number;
  public minChoices?: number;
  public orientation?: "horizontal" | "vertical";
  public minSelectionsMessage?: string;
  public maxSelectionsMessage?: string;

  constructor(options: ChoiceInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.maxChoices = options.maxChoices;
    this.minChoices = options.minChoices;
    this.orientation = options.orientation;
    this.minSelectionsMessage = options.minSelectionsMessage;
    this.maxSelectionsMessage = options.maxSelectionsMessage;
    this.choices = options.choices;
  }

  public static fromXmlString(xml: string): ChoiceInteraction {
    const choices: SimpleChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-choice-interaction");

    $("qti-simple-choice").each((_, node) => {
      const choice = $(node);
      choices.push({
        identifier: choice.attr("identifier")!,
        fixed: choice.attr("fixed") === "true",
        templateIdentifier: choice.attr("template-identifier"),
        label: choice.attr("label"),
        content: (choice.html() || "").trim(),
      });
    });

    return new ChoiceInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      minChoices: $root.attr("min-choices")
        ? Number($root.attr("min-choices"))
        : undefined,
      maxChoices: $root.attr("max-choices")
        ? Number($root.attr("max-choices"))
        : undefined,
      orientation: $root.attr("orientation") as "horizontal" | "vertical",
      minSelectionsMessage: $root.attr("data-min-selections-message"),
      maxSelectionsMessage: $root.attr("data-max-selections-message"),
      choices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-choice-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      [attr("max-choices")]: this.maxChoices?.toString(),
      [attr("min-choices")]: this.minChoices?.toString(),
      orientation: this.orientation,
      "data-min-selections-message": this.minSelectionsMessage,
      "data-max-selections-message": this.maxSelectionsMessage,
    });

    for (const choice of this.choices || []) {
      appendHtmlFragment(
        choice.content || "",
        item.ele(el("qti-simple-choice"), {
          identifier: choice.identifier,
          fixed: choice.fixed ? "true" : "false",
          [attr("template-identifier")]: choice.templateIdentifier,
          label: choice.label,
        }),
      );
    }

    return item;
  }
}
