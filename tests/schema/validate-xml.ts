import { memoryPages, validateXML } from "xmllint-wasm";

import { QtiVersion } from "../../src";
import { resolveSchemaClosure } from "./resolve-schema-closure";

/** Which 1EdTech schema a document should be validated against. */
export type QtiSchemaKind = "asi" | "manifest";

export type ValidateQtiXmlOptions = {
  /** QTI version. Auto-detected from the document namespace when omitted. */
  version?: QtiVersion;
  /**
   * Whether the document is an assessment item/test/section ("asi") or an IMS
   * content package manifest ("manifest"). Auto-detected from the root element
   * when omitted.
   */
  kind?: QtiSchemaKind;
};

export type QtiValidationResult = {
  valid: boolean;
  /** Human-readable validation errors, empty when the document is valid. */
  errors: string[];
  /** The QTI version the document was validated against. */
  version: QtiVersion;
  /** The kind of schema the document was validated against. */
  kind: QtiSchemaKind;
};

/**
 * Root schema for every (kind, version) combination. These are the same URLs
 * the library advertises in `xsi:schemaLocation`; the resolver downloads each
 * one together with its full import/include closure.
 */
const ROOT_SCHEMAS: Record<QtiSchemaKind, Record<QtiVersion, string>> = {
  asi: {
    [QtiVersion.v3p0]:
      "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd",
    [QtiVersion.v2p1]:
      "https://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd",
  },
  manifest: {
    [QtiVersion.v3p0]:
      "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd",
    [QtiVersion.v2p1]:
      "https://www.imsglobal.org/xsd/qti/qtiv2p1/qtiv2p1_imscpv1p2_v1p0.xsd",
  },
};

/**
 * Validates a QTI/IMS XML string against the official 1EdTech XSD schemas.
 *
 * Schema resolution (downloading the root XSD and every imported/included
 * schema) is handled automatically and cached; the actual XSD validation is
 * performed by libxml2 via `xmllint-wasm`.
 *
 * Both the QTI version and the schema kind are auto-detected from the document
 * by default, so the common case is simply `await validateQtiXml(xml)`.
 */
export async function validateQtiXml(
  xml: string,
  options: ValidateQtiXmlOptions = {},
): Promise<QtiValidationResult> {
  const version = options.version ?? detectVersion(xml);
  const kind = options.kind ?? detectKind(xml);

  const rootUrl = ROOT_SCHEMAS[kind][version];
  const closure = await resolveSchemaClosure(rootUrl);

  const root = closure.files.find(
    (file) => file.fileName === closure.rootFileName,
  )!;
  const dependencies = closure.files.filter(
    (file) => file.fileName !== closure.rootFileName,
  );

  const result = await validateXML({
    xml: [{ fileName: "document.xml", contents: xml }],
    schema: [{ fileName: root.fileName, contents: root.contents }],
    preload: dependencies,
    // The QTI 3.0 ASI schema alone is ~18MB; give libxml2 room to compile it.
    initialMemoryPages: 256,
    maxMemoryPages: 2 * memoryPages.GiB,
  });

  return {
    valid: result.valid,
    errors: result.errors.map((error) => error.rawMessage),
    version,
    kind,
  };
}

/** Detects the QTI version from the document's default namespace. */
function detectVersion(xml: string): QtiVersion {
  const namespace = rootNamespace(xml);
  if (namespace?.includes("v2p1")) return QtiVersion.v2p1;
  return QtiVersion.v3p0;
}

/** Detects whether the document is a manifest or an assessment document. */
function detectKind(xml: string): QtiSchemaKind {
  return /<(?:\w+:)?manifest[\s>]/.test(xml) ? "manifest" : "asi";
}

function rootNamespace(xml: string): string | undefined {
  // The first xmlns on the document is the default namespace of the root.
  return /\sxmlns\s*=\s*"([^"]+)"/.exec(xml)?.[1];
}
