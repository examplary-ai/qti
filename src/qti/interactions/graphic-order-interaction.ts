import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  HotspotShape,
  ObjectOptions,
  HotspotChoiceOptions,
} from "./hotspot-interaction";
import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export { HotspotShape, ObjectOptions, HotspotChoiceOptions };

export type GraphicOrderInteractionOptions = QtiPromptInteractionOptions & {
  minChoices?: number;
  maxChoices?: number;
  object: ObjectOptions;
  hotspotChoices?: HotspotChoiceOptions[];
};

/**
 * Presents an image with hotspots for candidates to select in a specific order.
 * Used for sequencing tasks on diagrams, maps, or other visual content.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.973pocg92wxf
 *
 * @example
 * const interaction = new GraphicOrderInteraction({
 *   responseIdentifier: "RESPONSE",
 *   object: { data: "diagram.png", type: "image/png", width: 400, height: 300 },
 *   hotspotChoices: [
 *     { identifier: "A", shape: "circle", coords: "100,100,20" },
 *     { identifier: "B", shape: "circle", coords: "200,150,20" },
 *   ],
 * });
 */
export class GraphicOrderInteraction extends QtiPromptInteraction {
  public static tagName = "qti-graphic-order-interaction";

  public minChoices?: number;
  public maxChoices?: number;
  public object: ObjectOptions;
  public hotspotChoices?: HotspotChoiceOptions[];

  constructor(options: GraphicOrderInteractionOptions) {
    super(options);

    this.minChoices = options.minChoices;
    this.maxChoices = options.maxChoices;
    this.object = options.object;
    this.hotspotChoices = options.hotspotChoices;
  }

  public static fromXmlString(xml: string): GraphicOrderInteraction {
    const hotspotChoices: HotspotChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-graphic-order-interaction");
    const $object = $root.find("> object");

    $("qti-hotspot-choice").each((_, node) => {
      const hotspot = $(node);
      hotspotChoices.push({
        identifier: hotspot.attr("identifier")!,
        shape: hotspot.attr("shape") as HotspotShape,
        coords: hotspot.attr("coords")!,
        hotspotLabel: hotspot.attr("hotspot-label"),
        fixed: hotspot.attr("fixed") === "true",
        templateIdentifier: hotspot.attr("template-identifier"),
      });
    });

    return new GraphicOrderInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      minChoices: $root.attr("min-choices")
        ? Number($root.attr("min-choices"))
        : undefined,
      maxChoices: $root.attr("max-choices")
        ? Number($root.attr("max-choices"))
        : undefined,
      object: {
        data: $object.attr("data")!,
        type: $object.attr("type")!,
        width: $object.attr("width")
          ? Number($object.attr("width"))
          : undefined,
        height: $object.attr("height")
          ? Number($object.attr("height"))
          : undefined,
      },
      hotspotChoices,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-graphic-order-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("min-choices")]: this.minChoices?.toString(),
      [attr("max-choices")]: this.maxChoices?.toString(),
    });

    item.ele("object", {
      data: this.object.data,
      type: this.object.type,
      width: this.object.width?.toString(),
      height: this.object.height?.toString(),
    });

    for (const hotspot of this.hotspotChoices || []) {
      item.ele(el("qti-hotspot-choice"), {
        identifier: hotspot.identifier,
        shape: hotspot.shape,
        coords: hotspot.coords,
        [attr("hotspot-label")]: hotspot.hotspotLabel,
        fixed: hotspot.fixed ? "true" : undefined,
        [attr("template-identifier")]: hotspot.templateIdentifier,
      });
    }

    return item;
  }
}
