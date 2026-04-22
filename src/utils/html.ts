import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

export const appendHtmlFragment = (html: string, toElement: XMLBuilder) => {
  const doc = fragment(
    {
      invalidCharReplacement: "�",
    },
    `<div>${html}</div>`,
  );

  doc.each((child) => {
    toElement.import(child);
  });
};
