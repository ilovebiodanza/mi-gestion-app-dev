import { StringElement } from "./defaults/StringElement.js";
import { TextElement } from "./defaults/TextElement.js";
import { SecretElement } from "./defaults/SecretElement.js";
import { SeparatorElement } from "./defaults/SeparatorElement.js";
import { NumberElement } from "./defaults/NumberElement.js";
import { CurrencyElement } from "./defaults/CurrencyElement.js";
import { PercentageElement } from "./defaults/PercentageElement.js";
import { BooleanElement } from "./defaults/BooleanElement.js";
import { SelectElement } from "./defaults/SelectElement.js";
import { DateElement } from "./defaults/DateElement.js";
import { EmailElement } from "./defaults/EmailElement.js";
import { UrlElement } from "./defaults/UrlElement.js";
import { TableElement } from "./defaults/TableElement.js";

const registry = {
  string: StringElement,
  text: TextElement,
  secret: SecretElement,
  separator: SeparatorElement,
  number: NumberElement,
  currency: CurrencyElement,
  percentage: PercentageElement,
  boolean: BooleanElement,
  select: SelectElement,
  date: DateElement,
  email: EmailElement,
  url: UrlElement,
  table: TableElement,
};

export class ElementRegistry {
  static get(type) {
    return registry[type] || registry["string"];
  }

  static getAvailableTypes() {
    return Object.values(registry).map((Class) => ({
      type: Class.getType(),
      label: Class.getLabel(),
      icon: Class.getIcon(),
      description: Class.getDescription(),
    }));
  }
}
