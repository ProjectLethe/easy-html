import { setEzVariables, createDialog } from "./easyHtml.js";

setEzVariables({ lol4: "This is a Test" });
setEzVariables({ lol1: true, theList: ["1", "2", "3"] });

const inputObj = [
  {
    id: "button1id",
    type: "button",
    description: "Say hello",
    onChange: () => {
      console.log("hello");
    },
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
    onChange: (values) => {
      console.log(values.yourName + ": " + values.justATextInput);
    },
  },
  {
    id: "areYouHappy",
    type: "checkbox",
    description: "Are you happy",
    default: false,
    onChange: (values) => {
      console.log("I am happy");
    },
  },
  {
    id: "favSearchengine",
    type: "dropdown",
    description: "What is your Favorite Search Engine?",
    choices: ["Google", "DuckDuckGo", "Ecosia", "other"],
    default: "Google",
    onChange: (values) => {
      console.log("DugDug");
    },
  },
  {
    id: "range",
    type: "range",
    min: 0,
    max: 100,
    showValue: true,
    description: "How old are you?",
    onChange: () => console.log("NumNum"),
  },
];

// Anwendung der Funktion
const { form, values } = createDialog(inputObj);
document.getElementById("lol").appendChild(form);
