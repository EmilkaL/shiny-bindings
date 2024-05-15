import { makeInputBinding } from "@posit-dev/shiny-bindings-core";
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
      const props = JSON.parse(el.dataset.props || "{}");

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
