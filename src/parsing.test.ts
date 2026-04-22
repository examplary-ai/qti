import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import {
  ImsPackage,
  ImsManifestResourceType,
  QtiItem,
  ChoiceInteraction,
} from ".";

describe("Parsing", () => {
  test("parse simple QTI bundle", async () => {
    const filePath = "../tests/stubs/simple.zip";
    const fullPath = new URL(filePath, import.meta.url);
    const contents = await readFile(fullPath);
    const pkg = await ImsPackage.fromZip(contents);

    const items = pkg.manifest.getResourcesOfType(
      ImsManifestResourceType.imsqti_item_xmlv3p0,
    );

    expect(items.length).toBe(1);
    expect(items[0].identifier).toBe("choice");
    expect(items[0].href).toBe("choice.xml");

    const xml = await pkg.getResourceContentsString("choice");
    expect(xml).toContain("<qti-assessment-item");

    const item = QtiItem.fromXmlString(xml!);
    expect(item.identifier).toBe("choice");
    expect(item.title).toBe("Unattended Luggage");
    expect(item.getInteractions().length).toBe(1);

    const interaction = item.getInteractions()[0] as ChoiceInteraction;
    expect(interaction.type).toBe("ChoiceInteraction");
    expect(interaction.choices!.length).toBe(3);
    expect(
      interaction.choices![0].content ===
        "You must stay with your luggage at all times.",
    );
  });
});
