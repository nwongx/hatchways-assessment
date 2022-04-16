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

function App() {
  const {
    students,
    didDisplayIds,
    fetchState,
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
          onChange={(input) => {
            dispatch(queryIsUpdated({ type: 'name', value: input }));
          }}
        />
        <CustomeInput
          placeholder="Search by tag"
          onChange={(input) => {
            dispatch(queryIsUpdated({ type: 'tag', value: input }));
          }}
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
