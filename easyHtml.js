const baseEzForElemens = document.querySelectorAll("ez-for");
const ezVariables = {};
const varObserver = {};
const ezForChildrenMap = new Map();
for (const oneEzForElement of baseEzForElemens) {
  const childNodes = Array.from(oneEzForElement.childNodes);
  ezForChildrenMap.set(oneEzForElement, childNodes);
  ezRemoveChildren(oneEzForElement);
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
export function updateEzIfs(ezIfElements) {
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
export function updateEzValues(ezValueElemens) {
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
export function updateEzFor(ezForElemens) {
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

export function ezRemoveChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function createDialogElement(config, elements, level) {
  switch (config.type) {
    case "text":
      return new EzTextElement(config);
    case "textarea":
      return new EzTextAreaElement(config);
    case "button":
      return new EzButtonElement(config);
    case "dropdown":
      return new EzDropdownElement(config);
    case "number":
      return new EzNumberElement(config);
    case "checkbox":
      return new EzCheckboxElement(config);
    case "section":
      return new EzSectionElement(config, elements, level);
    default:
      throw new Error(`type ${config.type} is not supported`);
  }
}

export class EzDialog {
  constructor(config, elementsObj = {}) {
    this.elements = elementsObj;
    this._htmlElement = document.createElement("div");
    this._htmlElement.classList.add(
      "ez-dialog",
      "p-3",
      "flex",
      "flex-col",
      "w-fit"
    );
    //TODO Add obj config with headline and multiple step dialog
    let configList = config;
    if (!Array.isArray(config)) {
      throw new Error("config must be an array");
    }

    configList.forEach((elementConfig) => {
      if (elementConfig.id && elementConfig.type) {
        this.elements[elementConfig.id] = createDialogElement(elementConfig, this.elements, 2);
        this._htmlElement.appendChild(this.elements[elementConfig.id].htmlElement);
      }
    });
  }

  set htmlElement(value) {
    throw new Error("htmlElement is read-only");
  }
  get htmlElement() {
    return this._htmlElement;
  }
}

class EzAbstractElement {
  constructor(config) {
    this._type = config.type;
    this._description = config.description || "";
    this._value = config.default;

    this._htmlElement = document.createElement("div");
    this._htmlElement.classList.add("ez-input", "m-3", "flex", "items-end");
    this._childrenContainer = document.createElement("label");
    this._childrenContainer.classList.add("w-full", "block");
    this.isVisible = config.isVisible;

    this._callbacks = [];
    this._descriptionElement = document.createElement("span");
    this._descriptionElement.classList.add("w-full", "block", "text-xs");
    this._descriptionElement.innerText = this._description || "";
    this._errorLabel = document.createElement("span");
    this._errorLabel.classList.add("w-full", "text-error");
    this.error = config.error || "";
    this._warningLabel = document.createElement("span");
    this._warningLabel.classList.add("w-full", "text-warning");
    this.warning = config.warning || "";
  }

  set htmlElement(value) {
    throw new Error("htmlElement is read-only");
  }
  get htmlElement() {
    return this._htmlElement;
  }

  set type(value) {
    throw new Error("type is read-only");
  }
  get type() {
    return this._type;
  }

  set description(value) {
    this._descriptionElement.innerText = value;
    this.description = value;
  }
  get description() {
    return this._description;
  }

  set isVisible(value = true) {
    if (value === this._isVisible) {
      return;
    }
    if (value) {
      this._htmlElement.appendChild(this._childrenContainer);
      this._htmlElement.classList.remove("hidden");
    } else {
      ezRemoveChildren(this._htmlElement);
      this._htmlElement.classList.add("hidden");
    }
    this._isVisible = value;
  }
  get isVisible() {
    return this._isVisible;
  }

  set error(value) {
    this._errorLabel.innerText = value;
    this._errorLabel.style.display = value && value != "" ? "block" : "none";
  }
  get error() {
    return this._errorLabel.innerText || "";
  }

  set warning(value) {
    this._warningLabel.innerText = value;
    this._warningLabel.style.display = value && value != "" ? "block" : "none";
  }
  get warning() {
    return this._warningLabel.innerText || "";
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

class EzTextAbstractElement extends EzAbstractElement {
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
    this._inputElement.classList.add(
      "w-full",
      "block",
      "input",
      "input-bordered"
    );

    this._childrenContainer.appendChild(this._descriptionElement);
    this._childrenContainer.appendChild(this._inputElement);
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);
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
    this._inputElement.classList.add(
      "w-full",
      "block",
      "textarea",
      "textarea-bordered"
    );

    this._childrenContainer.appendChild(this._descriptionElement);
    this._childrenContainer.appendChild(this._inputElement);
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);
  }
}

export class EzButtonElement extends EzAbstractElement {
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("button");
    this._inputElement.innerText = config.description;
    this._inputElement.onclick = () =>
      this._callbacks.forEach((callback) => callback());
    this._inputElement.classList.add("block", "btn", "btn-primary");

    this._childrenContainer.appendChild(this._inputElement);
  }
  set value(value) {
    return;
  }
  get value() {
    return undefined;
  }
}

export class EzDropdownElement extends EzAbstractElement {
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
    this._inputElement.classList.add(
      "w-full",
      "block",
      "select",
      "select-bordered"
    );

    this._childrenContainer.appendChild(this._descriptionElement);
    this._childrenContainer.appendChild(this._inputElement);
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);
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
    ezRemoveChildren(this._inputElement);
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

export class EzNumberElement extends EzAbstractElement {
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
    config.default = config.default || config.min || 0;

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
    this._rangeElement.classList.add("w-full", "block", "range");

    this._inputElement = document.createElement("input");
    this._inputElement.type = "number";
    this._inputElement.min = config.min;
    this._inputElement.max = config.max;
    this._inputElement.value = config.default || 0;
    this._inputElement.onchange = () => (this.value = this._inputElement.value);
    this._inputElement.classList.add(
      "w-full",
      "block",
      "input",
      "input-bordered"
    );

    this._childrenContainer.appendChild(this._descriptionElement);
    if (config.isRange) {
      if (
        isNaN(config.default) ||
        config.default > config.max ||
        config.default < config.min
      ) {
        throw new Error(`default value (${config.default}) must be vallid`);
      }
      this._childrenContainer.appendChild(this._rangeElement);
      this._childrenContainer.appendChild(this._valueLabel);
    } else {
      this._childrenContainer.appendChild(this._inputElement);
    }
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);
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
    if (this._onlyInt === true && !Number.isInteger(Number(value))) {
      this.error = "Input must be an integer";
      return;
    }
    if (value == "" || Number.isNaN(value)) {
      this.error = "Input must be a number";
      return;
    }
    value = Number(value);
    if (value < this.min) {
      this.value = this.min;
      this.warning = `Input (${value}) must be greater than ${this.min}`;
      return;
    }
    if (value > this.max) {
      this.value = this.max;
      this.warning = `Input (${value}) must be smaller than ${this.max}`;
      return;
    }
    this.error = "";
    this.warning = "";
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

export class EzCheckboxElement extends EzAbstractElement {
  constructor(config) {
    super(config);

    this._inputElement = document.createElement("input");
    this._inputElement.type = "checkbox";
    this._inputElement.checked = config.default;
    this._inputElement.onchange = () =>
      (this.value = this._inputElement.checked);

    this.isSwitch = config.isSwitch === true;
    this._descriptionElement.classList.add("text-base", "inline", "mr-2");
    this._descriptionElement.classList.remove("w-full");
    this._childrenContainer.classList.add("flex", "items-center");

    this._childrenContainer.appendChild(this._descriptionElement);
    this._childrenContainer.appendChild(this._inputElement);
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);
  }

  set isSwitch(value) {
    this._isSwitch = value;
    if (this._isSwitch) {
      this._inputElement.classList.remove("checkbox");
      this._inputElement.classList.add("toggle", "toggle-primary");
    } else {
      this._inputElement.classList.remove("toggle", "toggle-primary");
      this._inputElement.classList.add("checkbox");
    }
  }
  get isSwitch() {
    return this._isSwitch;
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
export class EzSectionElement extends EzAbstractElement {
  constructor(config, elements, level) {
    super(config);
    this._htmlElement.classList.add("ez-section");
    this._childrenContainer = document.createElement("div");
    this._header = document.createElement("div");
    if (config.foldable) {
      this._childrenContainer = document.createElement("details");
      this._header = document.createElement("summary");
      this._header.classList.add("btn", "block", "w-full");
    }
    if (level < 1) {
      throw new Error(`level must be between 1 and 6 not ${level}`);
    }
    level = level > 6 ? 6 : level;
    this._headline = document.createElement(`h${level}`);
    this._headline.innerText = config.headline || "";

    this._childrenContainer.appendChild(this._header);
    this._childrenContainer.appendChild(this._headline);
    this._childrenContainer.appendChild(this._descriptionElement);
    this._childrenContainer.appendChild(this._errorLabel);
    this._childrenContainer.appendChild(this._warningLabel);

    configList.forEach((elementConfig) => {
      if (elementConfig.id && elementConfig.type) {
        elements[elementConfig.id] = createDialogElement(elementConfig, elements, level+1);
        this._htmlElement.appendChild(elements[elementConfig.id].htmlElement);
      }
    });

    this.isVisible = config.isVisible;
  }

  set headline(value) {
    this._headline.innerText = value;
  }
  get headline() {
    return this._headline.innerText;
  }
}
