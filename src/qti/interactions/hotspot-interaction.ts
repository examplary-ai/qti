import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type HotspotShape = "circle" | "rect" | "poly" | "ellipse" | "default";

export type HotspotChoiceOptions = {
  identifier: string;
  shape: HotspotShape;
  coords: string;
  hotspotLabel?: string;
  fixed?: boolean;
  templateIdentifier?: string;
};

export type ObjectOptions = {
  data: string;
  type: string;
  width?: number;
  height?: number;
};

export type HotspotInteractionOptions = QtiPromptInteractionOptions & {
  minChoices?: number;
  maxChoices?: number;
  object: ObjectOptions;
  hotspotChoices?: HotspotChoiceOptions[];
};

/**
 * Presents an image with defined clickable regions (hotspots) for candidates to select.
 * Used for questions where candidates identify specific areas on a diagram or map.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.y2th8rh73267
 *
 * @example
 * const interaction = new HotspotInteraction({
 *   responseIdentifier: "RESPONSE",
 *   maxChoices: 1,
 *   object: { data: "map.png", type: "image/png", width: 400, height: 300 },
 *   hotspotChoices: [
 *     { identifier: "A", shape: "circle", coords: "100,100,20" },
 *   ],
 * });
 */
export class HotspotInteraction extends QtiPromptInteraction {
  public static tagName = "qti-hotspot-interaction";

  public minChoices?: number;
  public maxChoices?: number;
  public object: ObjectOptions;
  public hotspotChoices?: HotspotChoiceOptions[];

  constructor(options: HotspotInteractionOptions) {
    super(options);

    this.minChoices = options.minChoices;
    this.maxChoices = options.maxChoices;
    this.object = options.object;
    this.hotspotChoices = options.hotspotChoices;
  }

  public static fromXmlString(xml: string): HotspotInteraction {
    const hotspotChoices: HotspotChoiceOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-hotspot-interaction");
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

    return new HotspotInteraction({
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

    const item = fragment().ele(el("qti-hotspot-interaction"), {
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
