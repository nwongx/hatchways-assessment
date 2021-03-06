import React, { useEffect, useState } from "react";
import { useDidMount } from "../app/hooks";

type CustomeInputProps = {
  placeholder: string;
  targetKeyUp?: string;
  onChange?: (input: string) => void;
  onKeyUp?: (input: string) => void;
};

function CustomeInput({
  placeholder,
  targetKeyUp,
  onChange,
  onKeyUp,
}: CustomeInputProps) {
  const [input, setInput] = useState<string>("");
  const [keyUp, setKeyUp] = useState<string>("");
  const isDidMount = useDidMount();

  useEffect(() => {
    if (isDidMount && onChange) {
      onChange(input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    if (isDidMount && onKeyUp && targetKeyUp === keyUp) {
      onKeyUp(input);
      setInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyUp]);
  const specificClassName = onKeyUp
    ? "leading-8 px-0.5 text-sm border-b"
    : "leading-10 px-1 mx-2 text-xl mx-2 border-b-2";

  return (
    <input
      className={`${specificClassName} font-thin text-gray-800 placeholder-gray-350 mt-2 border-gray-250 focus:outline-none focus:border-gray-800`}
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyUp={(e) => setKeyUp(e.key)}
    />
  );
}

export default CustomeInput;
