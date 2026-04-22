import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type PositionObjectStageOptions = {
  data: string;
  type: string;
  width?: number;
  height?: number;
};

export type PositionObjectOptions = {
  data: string;
  type: string;
  width?: number;
  height?: number;
};

export type PositionObjectInteractionOptions = QtiPromptInteractionOptions & {
  centerPoint?: string;
  minChoices?: number;
  maxChoices?: number;
  object: PositionObjectOptions;
  positionObjectStage?: PositionObjectStageOptions;
};

/**
 * Presents a movable object that candidates must position on a background stage.
 * Used for placing items at specific coordinates on a canvas or diagram.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.4jhs37jil26s
 *
 * @example
 * const interaction = new PositionObjectInteraction({
 *   responseIdentifier: "RESPONSE",
 *   object: { data: "marker.png", type: "image/png", width: 20, height: 20 },
 *   positionObjectStage: { data: "map.png", type: "image/png", width: 400, height: 300 },
 * });
 */
export class PositionObjectInteraction extends QtiPromptInteraction {
  public static tagName = "qti-position-object-interaction";

  public centerPoint?: string;
  public minChoices?: number;
  public maxChoices?: number;
  public object: PositionObjectOptions;
  public positionObjectStage?: PositionObjectStageOptions;

  constructor(options: PositionObjectInteractionOptions) {
    super(options);

    this.centerPoint = options.centerPoint;
    this.minChoices = options.minChoices;
    this.maxChoices = options.maxChoices;
    this.object = options.object;
    this.positionObjectStage = options.positionObjectStage;
  }

  public static fromXmlString(xml: string): PositionObjectInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-position-object-interaction");
    const $object = $root.find("> object");
    const $stage = $root.find("qti-position-object-stage");
    const $stageObject = $stage.find("object");

    let positionObjectStage: PositionObjectStageOptions | undefined;
    if ($stageObject.length) {
      positionObjectStage = {
        data: $stageObject.attr("data")!,
        type: $stageObject.attr("type")!,
        width: $stageObject.attr("width")
          ? Number($stageObject.attr("width"))
          : undefined,
        height: $stageObject.attr("height")
          ? Number($stageObject.attr("height"))
          : undefined,
      };
    }

    return new PositionObjectInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      centerPoint: $root.attr("center-point"),
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
      positionObjectStage,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-position-object-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("center-point")]: this.centerPoint,
      [attr("min-choices")]: this.minChoices?.toString(),
      [attr("max-choices")]: this.maxChoices?.toString(),
    });

    item.ele("object", {
      data: this.object.data,
      type: this.object.type,
      width: this.object.width?.toString(),
      height: this.object.height?.toString(),
    });

    if (this.positionObjectStage) {
      const stage = item.ele(el("qti-position-object-stage"));
      stage.ele("object", {
        data: this.positionObjectStage.data,
        type: this.positionObjectStage.type,
        width: this.positionObjectStage.width?.toString(),
        height: this.positionObjectStage.height?.toString(),
      });
    }

    return item;
  }
}
