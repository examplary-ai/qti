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

export type GapTextOptions = {
  identifier: string;
  matchMax?: number;
  matchMin?: number;
  matchGroup?: string;
  content?: string;
};

export type GapMatchInteractionOptions = QtiPromptInteractionOptions & {
  shuffle?: boolean;
  minAssociations?: number;
  maxAssociations?: number;
  gapTexts?: GapTextOptions[];
  content?: string;
};

/**
 * Presents candidates with a set of gaps within content and a set of choices to fill them.
 * Candidates drag or select choices to match them with the appropriate gaps.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.7sroqk3xl8e1
 *
 * @example
 * const interaction = new GapMatchInteraction({
 *   responseIdentifier: "RESPONSE",
 *   gapTexts: [
 *     { identifier: "gap-1", content: "Paris" },
 *     { identifier: "gap-2", content: "London" },
 *   ],
 *   content: "<p>The capital of France is <qti-gap identifier='G1'/>.</p>",
 * });
 */
export class GapMatchInteraction extends QtiPromptInteraction {
  public static tagName = "qti-gap-match-interaction";

  public shuffle?: boolean;
  public minAssociations?: number;
  public maxAssociations?: number;
  public gapTexts?: GapTextOptions[];
  public content?: string;

  constructor(options: GapMatchInteractionOptions) {
    super(options);

    this.shuffle = options.shuffle;
    this.minAssociations = options.minAssociations;
    this.maxAssociations = options.maxAssociations;
    this.gapTexts = options.gapTexts;
    this.content = options.content;
  }

  public static fromXmlString(xml: string): GapMatchInteraction {
    const gapTexts: GapTextOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-gap-match-interaction");

    $("qti-gap-text").each((_, node) => {
      const gapText = $(node);
      gapTexts.push({
        identifier: gapText.attr("identifier")!,
        matchMax: gapText.attr("match-max")
          ? Number(gapText.attr("match-max"))
          : undefined,
        matchMin: gapText.attr("match-min")
          ? Number(gapText.attr("match-min"))
          : undefined,
        matchGroup: gapText.attr("match-group"),
        content: (gapText.html() || "").trim(),
      });
    });

    const $clone = $root.clone();
    $clone.find("qti-gap-text").remove();
    const content = ($clone.html() || "").trim();

    return new GapMatchInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      shuffle: $root.attr("shuffle") === "true",
      minAssociations: $root.attr("min-associations")
        ? Number($root.attr("min-associations"))
        : undefined,
      maxAssociations: $root.attr("max-associations")
        ? Number($root.attr("max-associations"))
        : undefined,
      gapTexts,
      content: content || undefined,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    // QTI 2.1's gapMatchInteraction does not permit min/max-associations.
    const associations =
      version === QtiVersion.v2p1
        ? {}
        : {
            [attr("min-associations")]: this.minAssociations?.toString(),
            [attr("max-associations")]: this.maxAssociations?.toString(),
          };

    const item = fragment().ele(el("qti-gap-match-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      shuffle: this.shuffle ? "true" : "false",
      ...associations,
    });

    for (const gapText of this.gapTexts || []) {
      const gapTextEl = item.ele(el("qti-gap-text"), {
        identifier: gapText.identifier,
        [attr("match-max")]: gapText.matchMax?.toString(),
        [attr("match-min")]: gapText.matchMin?.toString(),
        [attr("match-group")]: gapText.matchGroup,
      });

      if (gapText.content) {
        appendHtmlFragment(gapText.content, gapTextEl);
      }
    }

    if (this.content) {
      appendHtmlFragment(this.content, item);
    }

    return item;
  }
}
