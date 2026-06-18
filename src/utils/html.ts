import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

export const appendHtmlFragment = (html: string, toElement: XMLBuilder) => {
  const doc = fragment(
    {
      invalidCharReplacement: "�",
    },
    `<div>${html}</div>`,
  );

  // Import the wrapper's children directly rather than the wrapping <div>
  // itself, so the fragment can be placed in inline contexts (e.g. qti-gap-text,
  // qti-inline-choice) where a <div> is not permitted.
  doc.first().each((child) => {
    toElement.import(child);
  });
};

/**
 * Inverse of `appendHtmlFragment` when reading a cheerio element back: if the
 * element's only child is the bare `<div>` wrapper that `appendHtmlFragment`
 * produces, return its inner HTML; otherwise return the raw inner HTML.
 */
export const extractHtmlFragment = ($element: Cheerio<AnyNode>): string => {
  const children = $element.children();
  const onlyChild = children.length === 1 ? children.get(0) : undefined;
  if (
    onlyChild &&
    "tagName" in onlyChild &&
    onlyChild.tagName === "div" &&
    Object.keys(onlyChild.attribs).length === 0
  ) {
    return (children.first().html() || "").trim();
  }
  return ($element.html() || "").trim();
};
