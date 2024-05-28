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

export function createDialog(inputObject) {
  const form = document.createElement("div");
  const values = {};

  function createInput(key, config) {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.innerText = config.description;
    wrapper.appendChild(label);

    let input;

    switch (config.type) {
      case "text":
        input = document.createElement("input");
        input.type = "text";
        input.maxLength = config.length;
        input.placeholder = config.placeholder || "";
        input.value = config.default;
        if (config.onChange) {
          input.onchange = () => config.onChange(values);
        }
        break;
      case "button":
        input = document.createElement("button");
        input.innerText = config.description;
        if (config.onChange) {
          input.addEventListener("click", () => print("hello"));
        }
        break;
      case "switch":
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = config.default;
        if (config.onChange) {
          input.onchange = () => config.onChange(values);
        }
        break;
      case "dropdown":
        input = document.createElement("select");
        config.choices.forEach((choice) => {
          const option = document.createElement("option");
          option.value = choice;
          option.text = choice;
          input.appendChild(option);
        });
        input.value = config.default;
        if (config.onChange) {
          input.onchange = () => config.onChange(values);
        }
        break;
      case "number":
        input = document.createElement("input");
        input.type = "number";
        input.min = config.min;
        input.max = config.max;
        input.value = config.default || 0;
        if (config.onChange) {
          input.onchange = () => config.onChange(values);
        }
        break;
      case "checkbox":
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = config.default;
        if (config.onChange) {
          input.onchange = () => {
            print("lol");
            config.onChange(values);
          };
        }
        break;
      case "range":
        input = document.createElement("input");
        input.type = "range";
        input.min = config.min;
        input.max = config.max;
        input.value = config.default || 0;
        if (config.showValue) {
          const valueLabel = document.createElement("span");
          valueLabel.innerText = config.default || 0;
          input.addEventListener("input", () => {
            valueLabel.innerText = input.value;
          });
          wrapper.appendChild(valueLabel);
        }
        if (config.onChange) {
          input.onchange = () => config.onChange(values);
        }
        break;
    }

    wrapper.appendChild(input);
    return wrapper;
  }

  Object.keys(inputObject).forEach((key) => {
    const config = inputObject[key];
    values[key] = config.default || "";
    const inputElement = createInput(key, config);
    form.appendChild(inputElement);
  });

  return { form, values };
}
