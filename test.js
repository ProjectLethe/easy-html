import { setEzVariables, EzDialog} from "./easyHtml.js";

setEzVariables({ lol4: "This is a Test" });
setEzVariables({ lol1: true, theList: ["1", "2", "3"] });

const inputObj = [
  {
    id: "button1id",
    type: "button",
    description: "Say hello 2",
  },
  {
    id: "yourName",
    type: "text",
    length: 20,
    placeholder: "example Name",
    description: "Name:",
  },
  {
    id: "justATextInput",
    type: "textarea",
    length: 2000,
    description: "What do you want to say",
    placeholder: "Something",
  },
  {
    id: "areYouHappy",
    type: "checkbox",
    description: "Are you happy",
    default: false,
    isSwitch: true,
    
  },
  {
    id: "favSearchengine",
    type: "dropdown",
    description: "What is your Favorite Search Engine?",
    choices: ["Google", "DuckDuckGo", "Ecosia", "other"],
    default: "Google",
    isVisible: true,
  },
  {
    id: "range",
    type: "number",
    isRange: false,
    min: 10,
    max: 100,
    default: 50,
    showValue: true,
    description: "How old are you?",
  },
  {
    id: "range2",
    type: "number",
    isRange: false,
    min: 10,
    max: 100,
    default: 50,
    showValue: true,
    description: "How old are you?",
  },
  {
    id: "s1",
    type: "section",
    headline: "This is a Section",
    description: "This is a Section Description",
    foldable: true,
    children: [
      {
        id: "s1c1",
        type: "text",
        length: 20,
        description: "Name:",
      },
      {
        id: "s1c2",
        type: "textarea",
        length: 2000,
        description: "What do you want to say",
      },
    ]
  }
];

// Anwendung der Funktion
const dialogObj = new EzDialog(inputObj);
console.log(dialogObj);
document.getElementById("lol").appendChild(dialogObj._htmlElement);

dialogObj.elements.favSearchengine.subscribe((value) => {
  console.log("DugDug");
});