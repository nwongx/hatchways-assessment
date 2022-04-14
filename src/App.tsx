import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';
import StudentProfile from './components/studentProfile';
import { RootState } from './app/store';
import { useAppDispatch } from './app/hooks';
import {
  fetchStudentsRequest,
  listQueryIsUpdated,
  shouldDisplayNextStudentSlot,
} from './features/student/student.slice';
import CustomeInput from './components/customInput';

function App() {
  const {
    students,
    didDisplayStudentIds,
    fetchState,
    nextStudentSlotHeadPtr,
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
    <div className="h-screen bg-gray-250 rounded-4xl py-16 px-36">
      <div
        id="scrollableDiv"
        className="flex flex-col rounded h-full overflow-y-scroll no-scrollbar bg-white shadow-md"
      >
        <CustomeInput
          placeholder="Search by name"
          onChange={(input) => {
            dispatch(listQueryIsUpdated({ type: 'name', value: input }));
          }}
        />
        <CustomeInput
          placeholder="Search by tag"
          onChange={(input) => {
            dispatch(listQueryIsUpdated({ type: 'tag', value: input }));
          }}
        />

        <InfiniteScroll
          dataLength={nextStudentSlotHeadPtr}
          next={() => {
            dispatch(shouldDisplayNextStudentSlot());
          }}
          hasMore={hasMore}
          loader={<div>Loading...</div>}
          scrollableTarget="scrollableDiv"
        >
          {didDisplayStudentIds.map((id) => (
            <StudentProfile key={id} student={students[id]} />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
}

export default App;
