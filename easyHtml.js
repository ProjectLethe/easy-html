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

function print(value) {
  console.log(value);
}

export function setEzVariables(newValues) {
  Object.assign(ezVariables, newValues);
  updateEzIfs(baseEzIfElements);
  updateEzValues(baseEzValueElemens);
  updateEzFor(baseEzForElemens);
}

function updateEzIfs(ezIfElements) {
  for (const oneElement of ezIfElements) {
    const condition = ezVariables[oneElement.getAttribute("condition")];
    oneElement.style.display = condition ? "" : "none";
  }
}

function updateEzValues(ezValueElemens) {
  for (const oneElement of ezValueElemens) {
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
    const list = ezVariables[oneEzForElement.getAttribute("list")];
    if (!Array.isArray(list)) {
      continue;
    }
    const elementName = oneEzForElement.getAttribute("element");
    const counterName = oneEzForElement.getAttribute("counter");

    const childNodes = ezForChildrenMap.get(oneEzForElement);
    list.forEach((element, index) => {
      
      ezVariables[elementName] = element;
      ezVariables[counterName] = index;
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
