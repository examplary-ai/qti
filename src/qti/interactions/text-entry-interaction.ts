import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { QtiInteraction, QtiInteractionOptions } from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type TextEntryInteractionOptions = QtiInteractionOptions & {
  stringIdentifier?: string;
  expectedLength?: number;
  placeholderText?: string;
  format?: string;
  patternMask?: string;
  patternMaskMessage?: string;
};

/**
 * Presents a text input field for candidates to enter a short text response.
 * Used for fill-in-the-blank or short answer questions embedded inline.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.5bw8rpbotrcs
 *
 * @example
 * const interaction = new TextEntryInteraction({
 *   responseIdentifier: "RESPONSE",
 *   expectedLength: 20,
 *   placeholderText: "Enter your answer",
 * });
 */
export class TextEntryInteraction extends QtiInteraction {
  public static tagName = "qti-text-entry-interaction";

  public stringIdentifier?: string;
  public expectedLength?: number;
  public placeholderText?: string;
  public format?: string;
  public patternMask?: string;
  public patternMaskMessage?: string;

  constructor(options: TextEntryInteractionOptions) {
    super(options);

    this.stringIdentifier = options.stringIdentifier;
    this.expectedLength = options.expectedLength;
    this.placeholderText = options.placeholderText;
    this.format = options.format;
    this.patternMask = options.patternMask;
    this.patternMaskMessage = options.patternMaskMessage;
  }

  public static fromXmlString(xml: string): TextEntryInteraction {
    const $ = load(xml, { xmlMode: true });
    let $root = $("qti-text-entry-interaction");
    let version = QtiVersion.v3p0;
    if (!$root.length) {
      $root = $("textEntryInteraction");
      version = QtiVersion.v2p1;
    }
    const attr = (name: string) => $root.attr(toAttributeName(name, version));

    return new TextEntryInteraction({
      responseIdentifier: attr("response-identifier")!,
      label: $root.attr("label"),
      stringIdentifier: attr("string-identifier"),
      expectedLength: attr("expected-length")
        ? Number(attr("expected-length"))
        : undefined,
      placeholderText: attr("placeholder-text"),
      format: $root.attr("format"),
      patternMask: attr("pattern-mask"),
      patternMaskMessage: $root.attr("data-patternmask-message"),
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-text-entry-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      [attr("string-identifier")]: this.stringIdentifier,
      [attr("expected-length")]: this.expectedLength?.toString(),
      [attr("placeholder-text")]: this.placeholderText,
      format: this.format,
      [attr("pattern-mask")]: this.patternMask,
      "data-patternmask-message": this.patternMaskMessage,
    });

    return item;
  }
}
