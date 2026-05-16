import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

export type NamespacedElementContent =
  | string
  | { [key: string]: NamespacedElementContent }
  | NamespacedElementContent[];

export type NamespacedElement = {
  namespace: string;
  elementName: string;
  content: NamespacedElementContent;
  attributes?: Record<string, string | undefined>;
};

export abstract class QtiElement {
  protected namespaces: Record<string, string> = {};
  protected namespaceElements: NamespacedElement[] = [];

  public abstract buildXml(): string;

  public registerNamespace(prefix: string, uri: string): void {
    this.namespaces[prefix] = uri;
  }

  public addNamespacedElement(
    namespace: string,
    elementName: string,
    content: NamespacedElementContent,
    attributes?: Record<string, string | undefined>,
  ): void {
    this.namespaceElements.push({
      namespace,
      elementName,
      content,
      attributes,
    });
  }

  public getNamespacedElements(): NamespacedElement[] {
    return this.namespaceElements;
  }

  public getNamespacedElement(
    namespace: string,
    elementName: string,
  ): NamespacedElement | undefined {
    return this.namespaceElements.find(
      (e) => e.namespace === namespace && e.elementName === elementName,
    );
  }

  protected appendNamespacesAndElements(element: XMLBuilder): void {
    for (const [prefix, uri] of Object.entries(this.namespaces)) {
      element.att(`xmlns:${prefix}`, uri);
    }

    for (const nsElement of this.namespaceElements) {
      const child = element.ele(
        `${nsElement.namespace}:${nsElement.elementName}`,
        nsElement.attributes,
      );
      this.appendContent(child, nsElement.namespace, nsElement.content);
    }
  }

  private appendContent(
    element: XMLBuilder,
    namespace: string,
    content: NamespacedElementContent,
  ): void {
    if (typeof content === "string") {
      element.txt(content);
    } else if (Array.isArray(content)) {
      for (const item of content) {
        this.appendContent(element, namespace, item);
      }
    } else {
      for (const [key, value] of Object.entries(content)) {
        const child = element.ele(`${namespace}:${key}`);
        this.appendContent(child, namespace, value);
      }
    }
  }
}
