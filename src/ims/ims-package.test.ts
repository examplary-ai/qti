import { describe, expect, test } from "vitest";

import { ImsManifestResourceType } from "./ims-manifest";
import { ImsPackage } from "./ims-package";

describe("ImsPackage", () => {
  test("can include a resource and retrieve its contents", async () => {
    const imsPackage = new ImsPackage();
    const resourceIdentifier = "res1";
    const resourceFileName = "item1.xml";
    const resourceContent = "<item>Test Item</item>";

    // Add a resource with its associated file
    await imsPackage.addResource(
      {
        identifier: resourceIdentifier,
        type: ImsManifestResourceType.imsqti_item_xmlv3p0,
      },
      [
        {
          filename: resourceFileName,
          data: resourceContent,
        },
      ],
    );

    // Retrieve the contents of the resource
    const retrievedContent =
      await imsPackage.getResourceContentsString(resourceIdentifier);
    expect(retrievedContent).toBe(resourceContent);
  });

  test("can include a resource from a URL and retrieve its contents", async () => {
    const imsPackage = new ImsPackage();
    const resourceIdentifier = "res2";
    const resourceFileName = "item2.xml";
    const resourceContent = "<item>Test Item from URL</item>";
    const resourceUrl = "https://example.com/item2.xml";

    // Mock fetch to return the resource content
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === resourceUrl) {
        return {
          ok: true,
          arrayBuffer: async () =>
            new Uint8Array([...resourceContent].map((c) => c.charCodeAt(0))),
        } as unknown as Response;
      }
      throw new Error("URL not mocked");
    };

    // Add a resource with its associated file from URL
    await imsPackage.addResource(
      {
        identifier: resourceIdentifier,
        type: ImsManifestResourceType.imsqti_item_xmlv3p0,
      },
      [
        {
          filename: resourceFileName,
          url: resourceUrl,
        },
      ],
    );

    // Retrieve the contents of the resource
    const retrievedContent =
      await imsPackage.getResourceContentsString(resourceIdentifier);
    expect(retrievedContent).toBe(resourceContent);
  });
});
