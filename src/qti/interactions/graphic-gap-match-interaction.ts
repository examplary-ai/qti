import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  AssociableHotspotOptions,
  HotspotShape,
} from "./graphic-associate-interaction";
import { ObjectOptions } from "./hotspot-interaction";
import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type GapImgOptions = {
  identifier: string;
  matchMax?: number;
  matchMin?: number;
  matchGroup?: string;
  objectData: string;
  objectType: string;
  objectWidth?: number;
  objectHeight?: number;
  label?: string;
};

export type GraphicGapMatchInteractionOptions = QtiPromptInteractionOptions & {
  minAssociations?: number;
  maxAssociations?: number;
  object: ObjectOptions;
  gapImgs?: GapImgOptions[];
  associableHotspots?: AssociableHotspotOptions[];
};

/**
 * Presents an image with gap regions and a set of images/text to drag onto those regions.
 * Used for labeling diagrams or placing items in specific locations on an image.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.ous502odpreo
 *
 * @example
 * const interaction = new GraphicGapMatchInteraction({
 *   responseIdentifier: "RESPONSE",
 *   object: { data: "diagram.png", type: "image/png", width: 400, height: 300 },
 *   gapImgs: [
 *     { identifier: "img1", objectData: "label1.png", objectType: "image/png" },
 *   ],
 *   associableHotspots: [
 *     { identifier: "gap1", shape: "rect", coords: "50,50,100,80", matchMax: 1 },
 *   ],
 * });
 */
export class GraphicGapMatchInteraction extends QtiPromptInteraction {
  public static tagName = "qti-graphic-gap-match-interaction";

  public minAssociations?: number;
  public maxAssociations?: number;
  public object: ObjectOptions;
  public gapImgs?: GapImgOptions[];
  public associableHotspots?: AssociableHotspotOptions[];

  constructor(options: GraphicGapMatchInteractionOptions) {
    super(options);

    this.minAssociations = options.minAssociations;
    this.maxAssociations = options.maxAssociations;
    this.object = options.object;
    this.gapImgs = options.gapImgs;
    this.associableHotspots = options.associableHotspots;
  }

  public static fromXmlString(xml: string): GraphicGapMatchInteraction {
    const gapImgs: GapImgOptions[] = [];
    const associableHotspots: AssociableHotspotOptions[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-graphic-gap-match-interaction");
    const $object = $root.find("> object");

    $("qti-gap-img").each((_, node) => {
      const gapImg = $(node);
      const $gapObject = gapImg.find("object");
      gapImgs.push({
        identifier: gapImg.attr("identifier")!,
        matchMax: gapImg.attr("match-max")
          ? Number(gapImg.attr("match-max"))
          : undefined,
        matchMin: gapImg.attr("match-min")
          ? Number(gapImg.attr("match-min"))
          : undefined,
        matchGroup: gapImg.attr("match-group"),
        label: gapImg.attr("label"),
        objectData: $gapObject.attr("data")!,
        objectType: $gapObject.attr("type")!,
        objectWidth: $gapObject.attr("width")
          ? Number($gapObject.attr("width"))
          : undefined,
        objectHeight: $gapObject.attr("height")
          ? Number($gapObject.attr("height"))
          : undefined,
      });
    });

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

    return new GraphicGapMatchInteraction({
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
      gapImgs,
      associableHotspots,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    // QTI 2.1's graphicGapMatchInteraction does not permit min/max-associations.
    const associations =
      version === QtiVersion.v2p1
        ? {}
        : {
            [attr("min-associations")]: this.minAssociations?.toString(),
            [attr("max-associations")]: this.maxAssociations?.toString(),
          };

    const item = fragment().ele(el("qti-graphic-gap-match-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      ...associations,
    });

    item.ele("object", {
      data: this.object.data,
      type: this.object.type,
      width: this.object.width?.toString(),
      height: this.object.height?.toString(),
    });

    for (const gapImg of this.gapImgs || []) {
      const gapImgEl = item.ele(el("qti-gap-img"), {
        identifier: gapImg.identifier,
        [attr("match-max")]: gapImg.matchMax?.toString(),
        [attr("match-min")]: gapImg.matchMin?.toString(),
        [attr("match-group")]: gapImg.matchGroup,
        label: gapImg.label,
      });

      gapImgEl.ele("object", {
        data: gapImg.objectData,
        type: gapImg.objectType,
        width: gapImg.objectWidth?.toString(),
        height: gapImg.objectHeight?.toString(),
      });
    }

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
