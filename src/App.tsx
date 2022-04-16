import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';
import StudentProfile from './components/studentProfile';
import { RootState } from './app/store';
import { useAppDispatch } from './app/hooks';
import {
  fetchStudentsRequest,
  queryIsUpdated,
  pageIsChanged,
} from './features/student/student.slice';
import CustomeInput from './components/customInput';
import { validateName, validateTag } from './utils/string';
import { toast } from 'react-toastify';

function App() {
  const {
    students,
    fetchState,
    didDisplayIds,
    nextStartIndex,
    hasMore,
  } = useSelector((state: RootState) => state.student);
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function fetchStudentsHelper() {
      await dispatch(fetchStudentsRequest());
    }

    fetchStudentsHelper();
  }, []);

  function nameQueryChangeHandler(input: string) {
    const trimName = input.trim();
    if(!validateName(trimName)) {
      toast('Invalid Name Query', { type: 'error'});
    } else {
      dispatch(queryIsUpdated({ type: 'name', value: trimName}));
    }
  }

  function tagaQueryChangeHandler(input: string) {
    const trimTag = input.trim();
    if(!validateTag(trimTag)) {
      toast('Invalid Tag Query', { type: 'error'});
    } else {
      dispatch(queryIsUpdated({ type: 'tag', value: trimTag}));
    }
  }


  if (fetchState === 'rejected') return <div>Something went wrong</div>;
  if (fetchState === 'pending') return <div>Loading...</div>;
  return (
    <div className="h-screen bg-gray-250 rounded-4xl lg:py-16 lg:px-36">
      <div
        id="scrollableDiv"
        className="flex flex-col rounded h-full overflow-y-scroll no-scrollbar bg-white shadow-md"
      >
        <CustomeInput
          placeholder="Search by name"
          onChange={nameQueryChangeHandler}
        />
        <CustomeInput
          placeholder="Search by tag"
          onChange={tagaQueryChangeHandler}
        />

        <InfiniteScroll
          dataLength={nextStartIndex}
          next={() => {
            dispatch(pageIsChanged());
          }}
          hasMore={hasMore}
          loader={<div>Loading...</div>}
          scrollableTarget="scrollableDiv"
        >
          {didDisplayIds.map((id) => (
            <StudentProfile key={id} student={students[id]} />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
}

export default App;
