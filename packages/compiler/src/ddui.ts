import type { DDUIXNamespacedIdentifier } from "@dduix/core";
import type { DDUIXLayoutElement } from "./layoutElement";

export interface DDUIRoot {
  "format_version": string;
  "minecraft:ui-root": {
    "description": {
      "identifier": string;
    };
    "attribs": {
      "rootPoint": string;
    };
    "layout": {
      "markup": DDUIElement[];
    };
  };
}

export interface DDUIElement {
  component: string;
  attribs?: Record<string, unknown>;
  children?: DDUIElement[];
}

export interface DDUIStyle {
  "format_version": string;
  "minecraft:ui-style": {
    "description": {
      "identifier": string;
    };
    "components": {
      [component: string]: Record<string, unknown>;
    };
  };
}

export class DDUIBuilder {
  static readonly RootFormatVersion = "1.21.130";
  static readonly StyleFormatVersion = "beta";

  static createRoot(
    identifier: DDUIXNamespacedIdentifier,
    rootPoint: DDUIXNamespacedIdentifier,
    markup: DDUIXLayoutElement[],
  ): DDUIRoot {
    return {
      "format_version": this.RootFormatVersion,
      "minecraft:ui-root": {
        "description": {
          "identifier": identifier.toString(),
        },
        "attribs": {
          "rootPoint": rootPoint.toString(),
        },
        "layout": {
          "markup": markup.map(element => this.createElement(element)),
        },
      },
    };
  }

  static createElements(layoutElements: DDUIXLayoutElement[]) {
    return layoutElements.map(e => this.createElement(e));
  }

  static createElement(layoutElement: DDUIXLayoutElement): DDUIElement {
    const element: DDUIElement = {
      component: layoutElement.component.nativeIdentifier,
    };

    for (const { identifier, value } of layoutElement.attributes) {
      element.attribs ??= {};

      const { nativeIdentifier } = layoutElement.component.attributes.get(identifier)!;

      element.attribs[nativeIdentifier] = value.toJSON();
    }

    if (layoutElement.children) {
      element.children = this.createElements(layoutElement.children);
    }

    return element;
  }

  static createStyle(
    identifier: DDUIXNamespacedIdentifier,
    declarations: {
      [component: string]: Record<string, unknown>;
    },
  ): DDUIStyle {
    return {
      "format_version": this.StyleFormatVersion,
      "minecraft:ui-style": {
        "description": {
          "identifier": identifier.toString(),
        },
        "components": declarations,
      },
    };
  }
}
