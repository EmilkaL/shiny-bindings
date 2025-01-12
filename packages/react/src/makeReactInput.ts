import { makeInputBinding } from "@posit-dev/shiny-bindings-core";
import React from "react";
import type { ReactNode } from "react";
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

function replaceElement(el) {
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
  const toReactNode = (htmlElement) => {
    // Создаем контейнер для портал
  
    // Возвращаем портал, который оборачивает переданный элемент

    return React.createElement('div', null, htmlElement);
  };

  // Function to recursively replace __id__ with the DOM element
  function replaceIdWithElement(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    // If the object has a __id__, replace it with the DOM element
    if ('__id__' in obj) {
      const id = obj['__id__'];
      const element = document.getElementById(id);
      element.parentNode.removeChild(element);
      return toReactNode(element) || toReactNode(obj); // Return the element or the original object if not found
    }

    // Recursively process properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = replaceIdWithElement(obj[key]);
      }
    }
    return obj;
  }

  // Replace __id__ in dataProps
  const modifiedDataProps = replaceIdWithElement(dataProps);
  return modifiedDataProps
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
      const props = replaceElement(el)

      // Remove the `data-props` attribute to keep the DOM clean
      delete el.dataset.props

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
