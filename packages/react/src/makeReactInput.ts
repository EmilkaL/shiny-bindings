import { makeInputBinding } from "@posit-dev/shiny-bindings-core";
import type { ReactNode } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

function replaceElement(el, container, idToReplace) {
  // Get the data-props attribute and parse it as JSON
  const dataPropsAttr = el.getAttribute('data-props');
  if (!dataPropsAttr) return;

  let dataProps;
  try {
    dataProps = JSON.parse(dataPropsAttr);
  } catch (e) {
    console.error('Invalid JSON in data-props attribute:', e);
    return;
  }

  // Function to create a React portal for a given HTML element
  const toReactNode = (htmlElement) => {
    container.appendChild(htmlElement);
    return ReactDOM.createPortal(htmlElement, container);
  };

  // Function to recursively replace objects with id: idToReplace with DOM elements
  function replaceIdWithElement(obj, id) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => replaceIdWithElement(item, id));
    }

    if (obj.id === id) {
      const element = document.getElementById(obj.id);
      if (element) {
        // Remove the element from its current parent
        element.parentNode.removeChild(element);
        // Create a portal for the element
        return toReactNode(element);
      }
      return obj; // or handle the case when element is not found
    }

    // Recursively process properties
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = replaceIdWithElement(obj[key], id);
      }
    }
    return newObj;
  }

  // Replace objects with id: idToReplace in dataProps
  const modifiedDataProps = replaceIdWithElement(dataProps, idToReplace);
  return modifiedDataProps;
}

export function makeReactInput<T, P extends Object>({
  name,
  selector,
  initialValue,
  renderComp,
  priority = "immediate",
}: {
  name: string;
  selector?: string;
  initialValue: T;
  renderComp: (props: {
    initialValue: T;
    updateValue: (x: T) => void;
  } & P) => ReactNode;
  priority?: "immediate" | "deferred";
}) {
  makeInputBinding<T>({
    name,
    selector,
    setup: (el, updateValue) => {
      // Fire off onNewValue with the initial value
      updateValue(initialValue);

      // Get the component props from `data-props` attribute
      // Pass the id to replace, assuming it's "__id__"
      const props = replaceElement(el, el, "__id__");

      // Remove the `data-props` attribute to keep the DOM clean
      el.removeAttribute('data-props');

      createRoot(el).render(
        renderComp({
          ...props,
          initialValue: initialValue,
          updateValue: (x) => updateValue(x, priority === "deferred"),
        })
      );
    },
  });
}