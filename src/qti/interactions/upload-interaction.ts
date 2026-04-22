import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type UploadInteractionOptions = QtiPromptInteractionOptions & {
  fileType?: string;
};

/**
 * Allows candidates to upload a file as their response.
 * Used for submitting documents, images, or other file-based answers.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.qtnex0r52anx
 *
 * @example
 * const interaction = new UploadInteraction({
 *   responseIdentifier: "RESPONSE",
 *   fileType: "application/pdf",
 * });
 */
export class UploadInteraction extends QtiPromptInteraction {
  public static tagName = "qti-upload-interaction";

  public fileType?: string;

  constructor(options: UploadInteractionOptions) {
    super(options);

    this.fileType = options.fileType;
  }

  public static fromXmlString(xml: string): UploadInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-upload-interaction");

    return new UploadInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      fileType: $root.attr("type"),
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-upload-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      type: this.fileType,
    });

    return item;
  }
}
