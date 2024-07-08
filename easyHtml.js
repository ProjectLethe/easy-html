const baseEzForElemens = document.querySelectorAll("ez-for");
const ezVariables = {};
const varObserver = {};
const ezForChildrenMap = new Map();
for (const oneEzForElement of baseEzForElemens) {
  const childNodes = Array.from(oneEzForElement.childNodes);
  ezForChildrenMap.set(oneEzForElement, childNodes);
  while (oneEzForElement.firstChild) {
    oneEzForElement.removeChild(oneEzForElement.firstChild);
  }
}

const baseEzIfElements = document.querySelectorAll("ez-if");
const baseEzValueElemens = document.querySelectorAll("ez-value");

for (const oneElement of baseEzIfElements) {
  const condition = oneElement.getAttribute("condition");
  if (varObserver[condition] == undefined) {
    varObserver[condition] = [];
  }
  varObserver[condition].push(oneElement);
}
for (const oneElement of baseEzValueElemens) {
  const varName = oneElement.getAttribute("var");
  if (varObserver[varName] == undefined) {
    varObserver[varName] = [];
  }
  varObserver[varName].push(oneElement);
}

function print(value) {
  console.log(value);
}

/**
 * Updates the ezVariables object with the provided new values and updates the display style of relevant ezIf, ezValue, and ezFor elements based on the updated values.
 *
 * @param {object} newValues - The new values to update the ezVariables object with.
 * @return {void} This function does not return a value.
 */
export function setEzVariables(newValues) {
  Object.assign(ezVariables, newValues);
  const relevantEzIfAndValueElements = Object.keys(newValues)
    .map((key) => (varObserver[key] == undefined ? [] : varObserver[key]))
    .flat(1);
  updateEzIfs(relevantEzIfAndValueElements);
  updateEzValues(relevantEzIfAndValueElements);
  updateEzFor(baseEzForElemens);
}

/**
 * Updates the display style of the given ezIfElements based on their conditions.
 *
 * @param {NodeList} ezIfElements - The list of ezIf elements to update.
 * @return {void} This function does not return a value.
 */
function updateEzIfs(ezIfElements) {
  for (const oneElement of ezIfElements) {
    if (
      oneElement.tagName.toLowerCase() !== "ez-if" ||
      !oneElement.hasAttribute("var")
    ) {
      continue;
    }
    const condition = ezVariables[oneElement.getAttribute("var")];
    oneElement.style.display = condition ? "" : "none";
  }
}

/**
 * Updates the ezValue elements in the document based on the values in the ezVariables object.
 *
 * @param {NodeList} ezValueElemens - The list of ezValue elements to update.
 * @return {void} This function does not return a value.
 */
function updateEzValues(ezValueElemens) {
  for (const oneElement of ezValueElemens) {
    if (
      oneElement.tagName.toLowerCase() !== "ez-value" ||
      !oneElement.hasAttribute("var")
    ) {
      continue;
    }
    const value = ezVariables[oneElement.getAttribute("var")];
    oneElement.innerText = value == undefined ? "" : value;
  }
}

/**
 * Updates the ezFor elements in the document based on the values in the ezVariables object.
 *
 * @return {void} This function does not return a value.
 */
function updateEzFor(ezForElemens) {
  for (const oneEzForElement of ezForElemens) {
    if (
      oneEzForElement.tagName.toLowerCase() !== "ez-for" ||
      !oneEzForElement.hasAttribute("var")
    ) {
      continue;
    }
    const list = ezVariables[oneEzForElement.getAttribute("var")];
    if (!Array.isArray(list)) {
      continue;
    }
    const elementName = oneEzForElement.getAttribute("element");
    const counterName = oneEzForElement.getAttribute("counter");

    const childNodes = ezForChildrenMap.get(oneEzForElement);
    list.forEach((element, index) => {
      if (elementName != undefined) {
        ezVariables[elementName] = element;
      }
      if (counterName != undefined) {
        ezVariables[counterName] = index;
      }
      const copies = childNodes.map((child) => child.cloneNode(true));
      const tempDiv = document.createElement("div");
      copies.forEach((copy) => tempDiv.appendChild(copy));
      const ezIfElements = tempDiv.querySelectorAll("ez-if");
      const ezValueElemens = tempDiv.querySelectorAll("ez-value");
      updateEzIfs(ezIfElements);
      updateEzValues(ezValueElemens);

      tempDiv.remove();
      copies.forEach((copy) => oneEzForElement.appendChild(copy));

      ezVariables[elementName] = undefined;
      ezVariables[counterName] = undefined;
    });
  }
}

export class EzDialog {
  constructor(config, elementsObj = {}) {
    this.elements = elementsObj;
    this._htmlElement = document.createElement("div");

    //TODO: add sections

    config.forEach((config) => {
      if (config.id && config.type) {
        let dialogElement;
        switch (config.type) {
          case "text":
            dialogElement = new EzTextElement(config);
            break;
          case "textarea":
            dialogElement = new EzTextAreaElement(config);
            break;
          case "button":
            dialogElement = new EzButtonElement(config);
            break;
          case "dropdown":
            dialogElement = new EzDropdownElement(config);
            break;
          case "number":
            dialogElement = new EzNumberElement(config);
            break;
          case "checkbox":
            dialogElement = new EzCheckboxElement(config);
            break;
          default:
            throw new Error(`type ${config.type} is not supported`);
        }
        this._htmlElement.appendChild(dialogElement._htmlElement);
        this.elements[config.id] = dialogElement;
      }
    });
  }
}

class EzInputAbstractElement {
  constructor(config) {
    this._type = config.type;
    this._description = config.description;
    this._value = config.default;
    this._htmlElement = document.createElement("div");

    this._callbacks = [];
    this._label = document.createElement("label");
    this._label.innerText = config.description;
    this._errorLabel = document.createElement("label");
    this._errorLabel.style.color = "red";
    this.error = config.error || "";
  }

  set type(value) {
    throw new Error("type is read-only");
  }
  get type() {
    return this._type;
  }

  set description(value) {
    this._label.innerText = value;
    this.description = value;
  }
  get description() {
    return this._description;
  }

  set error(value) {
    this._errorLabel.innerText = value;
    this._errorLabel.style.display = value && value != "" ? "" : "none";
  }
  get error() {
    return this._errorLabel.innerText || "";
  }

  set value(value) {
    this._value = value;
    this._callbacks.forEach((callback) => callback(value));
  }
  get value() {
    return this._value;
  }

  subscribe(callbackFunction) {
    if (typeof callbackFunction !== "function") {
      throw new Error("parameter of subscribe must be a function");
    }
    this._callbacks.push(callbackFunction);
  }
  unsubscribe(callbackFunction) {
    if (callbackFunction === undefined) {
      this._callbacks = [];
      return;
    }
    if (typeof callbackFunction !== "function") {
      throw new Error("parameter of unsubscribe must be a function");
    }
    this._callbacks = this._callbacks.filter(
      (callback) => callback !== callbackFunction
    );
  }
}

class EzTextAbstractElement extends EzInputAbstractElement {
  constructor(config) {
    super(config);
    this._regexStr = "";
    this._regexError = config.regexError;
    this._value = config.default || "";
    this.regex = config.regex;
  }
  set value(value) {
    if (this._inputElement.value !== value) {
      this._inputElement.value = value;
    }
    if (this._regex != undefined && this._regex.test(value) == false) {
      this.error =
        this._regexError || `Input must match regex ${this._regexStr}`;
    } else {
      this.error = "";
    }
    this._value = value;
    this._callbacks.forEach((callback) => callback(value));
  }

  set maxLength(value) {
    this._inputElement.maxLength = value;
  }
  get maxLength() {
    return this._inputElement.maxLength;
  }

  set placeholder(value) {
    this._inputElement.placeholder = value;
  }
  get placeholder() {
    return this._inputElement.placeholder;
  }

  set regex(value) {
    if (value == undefined || value == "") {
      this._regex = undefined;
      this._regexStr = "";
      return;
    }
    try {
      this._regex = new RegExp(`^${value}+$`, "m");
    } catch (e) {
      throw new Error(`submitted regex (${value}) must be valid`);
    }
    this.regexStr = value;
  }
  get regex() {
    return this._regexStr;
  }

  set regexError(value) {
    this._regexError = value;
    if (this._regex != undefined && this._regex.test(value) == false) {
      this.error =
        this._regexError || `Input must match regex ${this._regexStr}`;
    } else {
      this.error = "";
    }
  }
  get regexError() {
    return this._regexError;
  }
}

export class EzTextElement extends EzTextAbstractElement {
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("input");
    this._inputElement.type = "text";
    this._inputElement.maxLength = config.length;
    this._inputElement.placeholder = config.placeholder || "";
    this._inputElement.value = config.default || "";
    this._inputElement.onchange = () => (this.value = this._inputElement.value);

    this._htmlElement.appendChild(this._label);
    this._htmlElement.appendChild(this._inputElement);
    this._htmlElement.appendChild(this._errorLabel);
  }
}

export class EzTextAreaElement extends EzTextAbstractElement {
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("textarea");
    this._inputElement.maxLength = config.length;
    this._inputElement.placeholder = config.placeholder || "";
    this._inputElement.value = config.default || "";
    this._inputElement.onchange = () => (this.value = this._inputElement.value);
    this._inputElement.style.resize = "none";

    this._htmlElement.appendChild(this._label);
    this._htmlElement.appendChild(this._inputElement);
    this._htmlElement.appendChild(this._errorLabel);
  }
}

export class EzButtonElement extends EzInputAbstractElement {
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("button");
    this._inputElement.innerText = config.description;
    this._inputElement.onclick = () =>
      this._callbacks.forEach((callback) => callback());

    this._htmlElement.appendChild(this._inputElement);
  }
  set value(value) {
    return;
  }
  get value() {
    return undefined;
  }
}

export class EzDropdownElement extends EzInputAbstractElement {
  constructor(config) {
    super(config);
    this._value = config.default;

    if (Array.isArray(config.choices) === false) {
      throw new Error(`choices must be an array not ${config.choices}`);
    }
    this._inputElement = document.createElement("select");
    this._choices = config.choices;
    this._choices.forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice;
      option.text = choice;
      this._inputElement.appendChild(option);
    });
    this._inputElement.value = config.default;
    this._inputElement.onchange = () => (this.value = this._inputElement.value);

    this._htmlElement.appendChild(this._label);
    this._htmlElement.appendChild(this._inputElement);
    this._htmlElement.appendChild(this._errorLabel);
  }

  set value(value) {
    if (this._inputElement.value !== value) {
      this._inputElement.value = value;
    }
    this._value = value;
    this._callbacks.forEach((callback) => callback(value));
  }
  get value() {
    return this._inputElement.value;
  }

  set choices(value) {
    this._choices;
    while (this._inputElement.firstChild) {
      this._inputElement.removeChild(this._inputElement.firstChild);
    }
    value.forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice;
      option.text = choice;
      this._inputElement.appendChild(option);
    });
  }
  get choices() {
    return this._choices;
  }
}

export class EzNumberElement extends EzInputAbstractElement {
  constructor(config) {
    super(config);
    if (config.min > config.max) {
      throw new Error(
        `min (${config.min}) must be smaller than max (${config.max})`
      );
    }
    if (config.default !== undefined && isNaN(config.default)) {
      throw new Error(`default value (${config.default}) must be vallid`);
    }
    this._isRange = config.isRange;
    this._onlyInt = config.onlyInt === undefined || config.onlyInt === true;
    this._rangeElement = document.createElement("input");
    this._rangeElement.type = "range";
    this._rangeElement.min = config.min;
    this._rangeElement.max = config.max;
    this._rangeElement.value = config.default || 0;
    this._valueLabel = document.createElement("span");
    this._valueLabel.innerText = config.default || 0;
    this._rangeElement.onchange = () => (this.value = this._rangeElement.value);
    this._rangeElement.addEventListener("input", () => {
      this._valueLabel.innerText = this._rangeElement.value;
    });

    this._inputElement = document.createElement("input");
    this._inputElement.type = "number";
    this._inputElement.min = config.min;
    this._inputElement.max = config.max;
    this._inputElement.value = config.default || 0;
    this._inputElement.onchange = () => (this.value = this._inputElement.value);

    this._htmlElement.appendChild(this._label);
    if (config.isRange) {
      if (
        isNaN(config.default) ||
        config.default > config.max ||
        config.default < config.min
      ) {
        throw new Error(`default value (${config.default}) must be vallid`);
      }
      this._htmlElement.appendChild(this._rangeElement);
      this._htmlElement.appendChild(this._valueLabel);
    } else {
      this._htmlElement.appendChild(this._inputElement);
    }
    this._htmlElement.appendChild(this._errorLabel);
  }

  set min(value) {
    if (isNaN(value)) {
      throw new Error(`min (${value}) must be a number`);
    }
    if (value > this._inputElement.max) {
      throw new Error(
        `min (${value}) must be smaller than max (${this._inputElement.max})`
      );
    }
    if (value > this._inputElement.value) {
      this.value = value;
    }
    this._inputElement.min = value;
    this._rangeElement.min = value;
  }
  get min() {
    return this._inputElement.min;
  }

  set max(value) {
    if (isNaN(value)) {
      throw new Error(`max (${value}) must be a number`);
    }
    if (value < this._inputElement.min) {
      throw new Error(
        `max (${value}) must be greater than min (${this._inputElement.min})`
      );
    }
    if (value < this._inputElement.value) {
      this.value = value;
    }
    this._inputElement.max = value;
    this._rangeElement.max = value;
  }
  get max() {
    return this._inputElement.max;
  }

  set value(value) {
    if (this._onlyInt && !Number.isInteger(value)) {
      this.error = "Input must be an integer";
      console.log("NoInt");
      return;
    }
    if (value == "" || Number.isNaN(value)) {
      this.error = "Input must be a number";
      console.log("NoNum");
      return;
    }
    if (this._inputElement.value !== value) {
      this._inputElement.value = value;
      this._rangeElement.value = value;
    }
    this._value = value;
    this._callbacks.forEach((callback) => callback(value));
  }
  get value() {
    return this._inputElement.value;
  }

  set isRange(value) {
    throw new Error("isRange is read-only");
  }
  get isRange() {
    return this._isRange;
  }
}

export class EzCheckboxElement extends EzInputAbstractElement {
  //TODO: add switch
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("input");
    this._inputElement.type = "checkbox";
    this._inputElement.checked = config.default;
    this._inputElement.onchange = () =>
      (this.value = this._inputElement.checked);

    this._htmlElement.appendChild(this._label);
    this._htmlElement.appendChild(this._inputElement);
    this._htmlElement.appendChild(this._errorLabel);
  }

  set value(value) {
    if (this._inputElement.checked !== value) {
      this._inputElement.checked = value;
    }
    this._value = value;
    this._callbacks.forEach((callback) => callback(value));
  }
  get value() {
    return this._inputElement.checked;
  }
}
