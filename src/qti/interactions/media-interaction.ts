import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type MediaObjectOptions = {
  data: string;
  type: string;
  width?: number;
  height?: number;
};

export type MediaInteractionOptions = QtiPromptInteractionOptions & {
  autostart?: boolean;
  minPlays?: number;
  maxPlays?: number;
  loop?: boolean;
  object: MediaObjectOptions;
};

/**
 * Presents audio or video content that candidates must engage with before responding.
 * Used for listening comprehension, video analysis, or multimedia-based questions.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.u9utgghwf8ck
 *
 * @example
 * const interaction = new MediaInteraction({
 *   responseIdentifier: "RESPONSE",
 *   minPlays: 1,
 *   maxPlays: 3,
 *   object: { data: "audio.mp3", type: "audio/mpeg" },
 * });
 */
export class MediaInteraction extends QtiPromptInteraction {
  public static tagName = "qti-media-interaction";

  public autostart?: boolean;
  public minPlays?: number;
  public maxPlays?: number;
  public loop?: boolean;
  public object: MediaObjectOptions;

  constructor(options: MediaInteractionOptions) {
    super(options);

    this.autostart = options.autostart;
    this.minPlays = options.minPlays;
    this.maxPlays = options.maxPlays;
    this.loop = options.loop;
    this.object = options.object;
  }

  public static fromXmlString(xml: string): MediaInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-media-interaction");
    const $object = $root.find("object");

    return new MediaInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      autostart: $root.attr("autostart") === "true",
      minPlays: $root.attr("min-plays")
        ? Number($root.attr("min-plays"))
        : undefined,
      maxPlays: $root.attr("max-plays")
        ? Number($root.attr("max-plays"))
        : undefined,
      loop: $root.attr("loop") === "true",
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

    const item = fragment().ele(el("qti-media-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      autostart: this.autostart ? "true" : undefined,
      [attr("min-plays")]: this.minPlays?.toString(),
      [attr("max-plays")]: this.maxPlays?.toString(),
      loop: this.loop ? "true" : undefined,
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
