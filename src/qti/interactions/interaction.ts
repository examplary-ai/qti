import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import { toElementName } from "../../utils/version";
import { QtiVersion } from "../types";

export type QtiInteractionOptions = {
  responseIdentifier: string;
  label?: string;
};
export type QtiPromptInteractionOptions = QtiInteractionOptions & {
  prompt?: string;
};

export abstract class QtiInteraction {
  public responseIdentifier: string;
  public label?: string;
  public static tagName: string;
  /**
   * Whether this is an inline interaction. Inline interactions are not valid
   * as direct children of the item body and must be wrapped in a block-level
   * element (see QtiItem.buildXml).
   */
  public static inline = false;
  public type: string;

  constructor(options: QtiInteractionOptions) {
    this.responseIdentifier = options.responseIdentifier;
    this.label = options.label;
    this.type = this.constructor.name;
  }

  protected abstract buildXmlPayload(version: QtiVersion): XMLBuilder;
  public static fromXmlString(xml: string): ThisType<QtiInteraction> {
    throw new Error(`Not implemented: ${xml.toString()}`);
  }

  public getXmlBuilder(version: QtiVersion = QtiVersion.v3p0): XMLBuilder {
    return this.buildXmlPayload(version);
  }

  public buildXml(version: QtiVersion = QtiVersion.v3p0): string {
    return this.getXmlBuilder(version).end({ prettyPrint: true });
  }
}

export abstract class QtiPromptInteraction extends QtiInteraction {
  public prompt: string;

  constructor(options: QtiPromptInteractionOptions) {
    super({ responseIdentifier: options.responseIdentifier });

    this.prompt = options.prompt || "";
  }

  public getXmlBuilder(version: QtiVersion = QtiVersion.v3p0): XMLBuilder {
    const item = this.buildXmlPayload(version);
    const el = (name: string) => toElementName(name, version);

    // The QTI content model requires qti-prompt to be the first child of the
    // interaction, before any choices or other content. Append it, then move
    // it to the front (buildXmlPayload has already added the other children).
    const prompt = item.ele(el("qti-prompt")).txt(this.prompt);
    item.node.insertBefore(prompt.node, item.node.firstChild);

    return item;
  }
}
