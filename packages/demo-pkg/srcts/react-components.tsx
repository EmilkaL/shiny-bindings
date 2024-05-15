import {
  makeReactInput,
  makeReactOutput,
} from "@posit-dev/shiny-bindings-react";
import React from "react";

type Payload = { value: number };

makeReactOutput<Payload>({
  name: "custom-react-output",
  renderComp: ({ value }) => (
    <div
      style={{
        border: "1px solid black",
        padding: "1rem",
      }}
    >
      I am a react output with value: <strong>{value}</strong>
    </div>
  ),
});

interface MyInputProps {
  label: string;
  value: number;
  updateValue: (val: number) => void;
}

makeReactInput<number, MyInputProps>({
  name: "custom-react-input",
  initialValue: 0,
  renderComp: (props) => <MyInput {...props} />,
});

function MyInput({ label, value, updateValue }: MyInputProps) {
  const [val, setVal] = React.useState(value);

  return (
    <>
      <button
        onClick={(e) => {
          const newVal = val + 1;
          setVal(newVal);
          updateValue(newVal);
        }}
      >
        {label}
      </button>
    </>
  );
}
