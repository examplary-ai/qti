import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { HotspotShape, ObjectOptions } from "./hotspot-interaction";
import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export { HotspotShape, ObjectOptions };

export type AssociableHotspotOptions = {
  identifier: string;
  shape: HotspotShape;
  coords: string;
  matchMax?: number;
  matchMin?: number;
  matchGroup?: string;
  hotspotLabel?: string;
};

export type GraphicAssociateInteractionOptions = QtiPromptInteractionOptions & {
  minAssociations?: number;
  maxAssociations?: number;
  object: ObjectOptions;
  associableHotspots?: AssociableHotspotOptions[];
};

/**
 * Presents an image with hotspots for candidates to associate or connect with each other.
 * Used for drawing connections between points on a diagram or map.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.acwq9g2z1cwt
 *
 * @example
 * const interaction = new GraphicAssociateInteraction({
 *   responseIdentifier: "RESPONSE",
 *   object: { data: "circuit.png", type: "image/png", width: 400, height: 300 },
 *   associableHotspots: [
 *     { identifier: "A", shape: "circle", coords: "100,100,15", matchMax: 1 },
 *     { identifier: "B", shape: "circle", coords: "200,100,15", matchMax: 1 },
 *   ],
 * });
 */
export class GraphicAssociateInteraction extends QtiPromptInteraction {
  public static tagName = "qti-graphic-associate-interaction";

  public minAssociations?: number;
  public maxAssociations?: number;
  public object: ObjectOptions;
  public associableHotspots?: AssociableHotspotOptions[];

  constructor(options: GraphicAssociateInteractionOptions) {
    super(options);

    this.minAssociations = options.minAssociations;
    this.maxAssociations = options.maxAssociations;
    this.object = options.object;
    this.associableHotspots = options.associableHotspots;
  }

  public static fromXmlString(xml: string): GraphicAssociateInteraction {
    const associableHotspots: AssociableHotspotOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-graphic-associate-interaction");
    const $object = $root.find("> object");

    $("qti-associable-hotspot").each((_, node) => {
      const hotspot = $(node);
      associableHotspots.push({
        identifier: hotspot.attr("identifier")!,
        shape: hotspot.attr("shape") as HotspotShape,
        coords: hotspot.attr("coords")!,
        matchMax: hotspot.attr("match-max")
          ? Number(hotspot.attr("match-max"))
          : undefined,
        matchMin: hotspot.attr("match-min")
          ? Number(hotspot.attr("match-min"))
          : undefined,
        matchGroup: hotspot.attr("match-group"),
        hotspotLabel: hotspot.attr("hotspot-label"),
      });
    });

    return new GraphicAssociateInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      minAssociations: $root.attr("min-associations")
        ? Number($root.attr("min-associations"))
        : undefined,
      maxAssociations: $root.attr("max-associations")
        ? Number($root.attr("max-associations"))
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
      associableHotspots,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-graphic-associate-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("min-associations")]: this.minAssociations?.toString(),
      [attr("max-associations")]: this.maxAssociations?.toString(),
    });

    item.ele("object", {
      data: this.object.data,
      type: this.object.type,
      width: this.object.width?.toString(),
      height: this.object.height?.toString(),
    });

    for (const hotspot of this.associableHotspots || []) {
      item.ele(el("qti-associable-hotspot"), {
        identifier: hotspot.identifier,
        shape: hotspot.shape,
        coords: hotspot.coords,
        [attr("match-max")]: hotspot.matchMax?.toString(),
        [attr("match-min")]: hotspot.matchMin?.toString(),
        [attr("match-group")]: hotspot.matchGroup,
        [attr("hotspot-label")]: hotspot.hotspotLabel,
      });
    }

    return item;
  }
}
