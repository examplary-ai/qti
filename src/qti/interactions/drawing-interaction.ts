import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type DrawingObjectOptions = {
  data: string;
  type: string;
  width?: number;
  height?: number;
};

export type DrawingInteractionOptions = QtiPromptInteractionOptions & {
  object: DrawingObjectOptions;
};

/**
 * Presents a canvas where candidates can draw or annotate over a background image.
 * Used for freeform drawing, labeling, or annotation tasks.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.8yrkpwgsrs4b
 *
 * @example
 * const interaction = new DrawingInteraction({
 *   responseIdentifier: "RESPONSE",
 *   object: { data: "canvas.png", type: "image/png", width: 400, height: 300 },
 * });
 */
export class DrawingInteraction extends QtiPromptInteraction {
  public static tagName = "qti-drawing-interaction";

  public object: DrawingObjectOptions;

  constructor(options: DrawingInteractionOptions) {
    super(options);

    this.object = options.object;
  }

  public static fromXmlString(xml: string): DrawingInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-drawing-interaction");
    const $object = $root.find("object");

    return new DrawingInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
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
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-drawing-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
    });

    item.ele("object", {
      data: this.object.data,
      type: this.object.type,
      width: this.object.width?.toString(),
      height: this.object.height?.toString(),
    });

    return item;
  }
}
