import React, {
  ChangeEventHandler,
  FC,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import { useAppDispatch, useDidMount } from '../app/hooks';
import { searchQueryIsUpdated } from '../features/student/student.slice';

type CustomeInputProps = {
  placeholder: string;
  targetKeyUp?: string;
  onChange?: (input: string) => void;
  onKeyUp?: (input: string) => void;
};

const CustomeInput: FC<CustomeInputProps> = ({
  placeholder,
  targetKeyUp,
  onChange,
  onKeyUp,
}) => {
  const [input, setInput] = useState<string>('');
  const [keyUp, setKeyUp] = useState<string>('');
  const isDidMount = useDidMount();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isDidMount && onChange) {
      onChange(input);
    }
  }, [input]);

  useEffect(() => {
    if (isDidMount && onKeyUp && targetKeyUp === keyUp) {
      onKeyUp(input);
      setInput('');
    }
  }, [keyUp]);
  const specificClassName = onKeyUp
    ? 'leading-8 px-0.5 text-sm border-b'
    : 'leading-10 px-1 mx-2 text-xl mx-2 border-b-2';

  return (
    <input
      className={`${specificClassName} font-thin text-gray-800 placeholder-gray-350 mt-2 border-gray-250 focus:outline-none focus:border-gray-800`}
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyUp={(e) => setKeyUp(e.key)}
    />
  );
};

export default CustomeInput;
