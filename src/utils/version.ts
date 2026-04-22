import { QtiVersion } from "../qti/types";

/**
 * Converts a QTI 3.0 element name (kebab-case with qti- prefix)
 * to the appropriate format for the target version.
 *
 * Example: "qti-choice-interaction" -> "choiceInteraction" (v2.1)
 */
export function toElementName(qti3Name: string, version: QtiVersion): string {
  if (version === QtiVersion.v3p0) {
    return qti3Name;
  }

  // QTI 2.1: Remove "qti-" prefix and convert to camelCase
  const withoutPrefix = qti3Name.replace(/^qti-/, "");
  return kebabToCamel(withoutPrefix);
}

/**
 * Converts a QTI 3.0 attribute name (kebab-case)
 * to the appropriate format for the target version.
 *
 * Example: "response-identifier" -> "responseIdentifier" (v2.1)
 */
export function toAttributeName(qti3Name: string, version: QtiVersion): string {
  if (version === QtiVersion.v3p0) {
    return qti3Name;
  }

  // QTI 2.1: Convert to camelCase
  return kebabToCamel(qti3Name);
}

/**
 * Converts kebab-case to camelCase.
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Detects QTI version from XML namespace.
 */
export function detectVersionFromNamespace(namespace: string): QtiVersion {
  if (namespace.includes("v2p1") || namespace.includes("imsqti_v2p1")) {
    return QtiVersion.v2p1;
  }
  return QtiVersion.v3p0;
}

/**
 * Detects QTI version from manifest resource type.
 */
export function detectVersionFromResourceType(
  type: string,
): QtiVersion | undefined {
  if (type.includes("v2p1")) {
    return QtiVersion.v2p1;
  }
  if (type.includes("v3p0")) {
    return QtiVersion.v3p0;
  }
}

/**
 * Converts attributes object to version-appropriate attribute names.
 * Filters out undefined values.
 */
export function toVersionedAttributes(
  attrs: Record<string, string | undefined>,
  version: QtiVersion,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      result[toAttributeName(key, version)] = value;
    }
  }
  return result;
}
