import { makeInputBinding } from "@posit-dev/shiny-bindings-core";
import type { ReactNode } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

/**
 * Make a custom Shiny input binding using a react component.
 * @param name The name of the component.
 * @param selector The selector to use to find the element to bind to. Defaults to looking for
 * a class with the same name as the binding.
 * @param initialValue The initial value of the input
 * @param renderComp A function that renders the react component into the custom element
 * @param priority Should the value be immediately updated wait to the next even loop? Typically set at "immediate."
 */

function replaceElement(el, container) {
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

  // Function to recursively replace objects with id: "__id__" with DOM elements
  function replaceIdWithElement(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => replaceIdWithElement(item));
    }

    if (obj.id === "__id__") {
      const id = obj.id;
      const element = document.getElementById(id);
      if (element) {
        element.parentNode.removeChild(element);
        return toReactNode(element);
      }
      return obj; // or handle the case when element is not found
    }

    // Recursively process properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = replaceIdWithElement(obj[key]);
      }
    }
    return obj;
  }

  // Replace objects with id: "__id__" in dataProps
  const modifiedDataProps = replaceIdWithElement(dataProps);
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
      const props = replaceElement(el, el);

      // Remove the `data-props` attribute to keep the DOM clean
      delete el.dataset.props;

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