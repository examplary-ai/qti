import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type SliderInteractionOptions = QtiPromptInteractionOptions & {
  lowerBound: number;
  upperBound: number;
  step?: number;
  stepLabel?: boolean;
  orientation?: "horizontal" | "vertical";
  reverse?: boolean;
};

/**
 * Presents a slider control for candidates to select a numeric value within a range.
 * Used for questions requiring numeric input, ratings, or scale-based responses.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.s61xcrj4qcyj
 *
 * @example
 * const interaction = new SliderInteraction({
 *   responseIdentifier: "RESPONSE",
 *   lowerBound: 0,
 *   upperBound: 100,
 *   step: 10,
 * });
 */
export class SliderInteraction extends QtiPromptInteraction {
  public static tagName = "qti-slider-interaction";

  public lowerBound: number;
  public upperBound: number;
  public step?: number;
  public stepLabel?: boolean;
  public orientation?: "horizontal" | "vertical";
  public reverse?: boolean;

  constructor(options: SliderInteractionOptions) {
    super(options);

    this.lowerBound = options.lowerBound;
    this.upperBound = options.upperBound;
    this.step = options.step;
    this.stepLabel = options.stepLabel;
    this.orientation = options.orientation;
    this.reverse = options.reverse;
  }

  public static fromXmlString(xml: string): SliderInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-slider-interaction");

    return new SliderInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      lowerBound: Number($root.attr("lower-bound")),
      upperBound: Number($root.attr("upper-bound")),
      step: $root.attr("step") ? Number($root.attr("step")) : undefined,
      stepLabel: $root.attr("step-label") === "true",
      orientation: $root.attr("orientation") as "horizontal" | "vertical",
      reverse: $root.attr("reverse") === "true",
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-slider-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("lower-bound")]: this.lowerBound.toString(),
      [attr("upper-bound")]: this.upperBound.toString(),
      step: this.step?.toString(),
      [attr("step-label")]: this.stepLabel ? "true" : undefined,
      orientation: this.orientation,
      reverse: this.reverse ? "true" : undefined,
    });

    return item;
  }
}
