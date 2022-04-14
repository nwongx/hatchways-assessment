import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useRef, useEffect } from 'react';
import { AppDispatch, RootState } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useDidMount = () => {
  const didMountRef = useRef(false);
  useEffect(() => {
    didMountRef.current = true;
  }, []);
  return didMountRef.current;
};
