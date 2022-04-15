import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchStudents } from './student.api';
import {
  getNextPageInfo,
  getQuery,
  getSearchInfo,
  getShouldDisplayStudentIdsByName,
  getShouldDisplayStudentIdsByStudentIds,
  getShouldDisplayStudentIdsByTag,
} from './student.utils';
import type {
  ISearchQueryActionPaylod,
  IStudent,
  IStudentLocal,
} from './student.interface';
import type { RootState } from '../../app/store';

export interface StudentState {
  fetchState: 'idle' | 'pending' | 'rejected';
  students: Record<string, IStudentLocal>;
  studentIds: string[];
  shouldDisplayStudentIds: string[];
  didDisplayStudentIds: string[];
  searchName: string;
  searchTag: string;
  nextStartIndex: number;
  hasMore: boolean;
  searchNameCache: Record<string, { studentIds: string[]; refCount: number }>;
  searchNameCacheKeyQueue: string[];
  searchTagCache: Record<string, { studentIds: string[]; refCount: number }>;
  searchTagCacheKeyQueue: string[];
}

const initialState: StudentState = {
  fetchState: 'idle',
  students: {},
  studentIds: [],
  shouldDisplayStudentIds: [],
  didDisplayStudentIds: [],
  searchName: '',
  searchTag: '',
  nextStartIndex: 0,
  hasMore: true,
  searchNameCache: {},
  searchNameCacheKeyQueue: [],
  searchTagCache: {},
  searchTagCacheKeyQueue: [],
};

export const fetchStudentsRequest = createAsyncThunk<
  IStudent[],
  void,
  { state: RootState }
>(
  'student/fetchStudentsRequest',
  async () => {
    const res = await fetchStudents();
    return res.data.students;
  },
  {
    condition: (_, { getState }) => {
      const { fetchState } = getState().student;
      if (fetchState !== 'idle') return false;
    },
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    searchQueryIsUpdated: (
      state,
      action: PayloadAction<ISearchQueryActionPaylod>
    ) => {
      const { name, tag } = getQuery(
        { name: state.searchName, tag: state.searchTag },
        action.payload
      );

      const upperCaseQueryName = name.toUpperCase();
      const upperCaseQueryTag = tag.toUpperCase();
      let searchNameInfo,
        searchTagInfo,
        shouldDisplayStudentIds,
        shouldDisplayNameStudentIds,
        shouldDisplayTagStudentIds;

      if (name.length > 0) {
        searchNameInfo = getSearchInfo(
          state.searchNameCacheKeyQueue,
          state.searchNameCache,
          upperCaseQueryName,
          getShouldDisplayStudentIdsByName,
          state.students,
          state.studentIds
        );
        const {
          oldestKey,
          oldestKeyRefCount,
          targetKeyRefCount,
          shouldDisplayStudentIds,
        } = searchNameInfo;
        if (oldestKey) {
          if (oldestKeyRefCount === 0) {
            delete state.searchNameCache[oldestKey];
            state.searchNameCacheKeyQueue.shift();
          } else {
            state.searchNameCache[oldestKey].refCount = oldestKeyRefCount!;
          }
        }
        state.searchNameCache[upperCaseQueryName] = {
          studentIds: shouldDisplayStudentIds,
          refCount: targetKeyRefCount,
        };
        state.searchNameCacheKeyQueue.push(upperCaseQueryName);
        shouldDisplayNameStudentIds = shouldDisplayStudentIds;
      }

      if (tag.length > 0) {
        searchTagInfo = getSearchInfo(
          state.searchTagCacheKeyQueue,
          state.searchTagCache,
          upperCaseQueryTag,
          getShouldDisplayStudentIdsByTag,
          state.students,
          state.studentIds
        );
        const {
          oldestKey,
          oldestKeyRefCount,
          targetKeyRefCount,
          shouldDisplayStudentIds,
        } = searchTagInfo;
        if (oldestKey) {
          if (oldestKeyRefCount === 0) {
            delete state.searchTagCache[oldestKey];
            state.searchTagCacheKeyQueue.shift();
          } else {
            state.searchTagCache[oldestKey].refCount = oldestKeyRefCount!;
          }
        }
        state.searchTagCache[upperCaseQueryTag] = {
          studentIds: shouldDisplayStudentIds,
          refCount: targetKeyRefCount,
        };
        state.searchTagCacheKeyQueue.push(upperCaseQueryTag);
        shouldDisplayTagStudentIds = shouldDisplayStudentIds;
      }

      if (searchNameInfo && searchTagInfo) {
        shouldDisplayStudentIds = getShouldDisplayStudentIdsByStudentIds(
          searchNameInfo.shouldDisplayStudentIds,
          searchTagInfo.shouldDisplayStudentIds
        );
      } else if (shouldDisplayNameStudentIds) {
        shouldDisplayStudentIds = shouldDisplayNameStudentIds;
      } else if (shouldDisplayTagStudentIds) {
        shouldDisplayStudentIds = shouldDisplayTagStudentIds;
      } else {
        shouldDisplayStudentIds = state.studentIds;
      }

      state.searchName = name;
      state.searchTag = tag;
      state.shouldDisplayStudentIds = shouldDisplayStudentIds;
      const { size, hasMore } = getNextPageInfo(shouldDisplayStudentIds);
      state.hasMore = hasMore;
      state.nextStartIndex = size;
      state.didDisplayStudentIds = shouldDisplayStudentIds.slice(0, size);
    },
    studentTagIsAdded: (
      state,
      action: PayloadAction<{ id: string; tag: string }>
    ) => {
      const { id, tag } = action.payload;
      const student = state.students[id];
      if (!student) {
        // TODO: error handling
        throw new Error('Student not found');
      }
      if (tag.length === 0) {
        // TODO: error handling
        throw new Error('Tag cannot be empty');
      }
      if (!new Set(student.tags).has(tag)) {
        student.tags = [...student.tags, tag];
        if (state.searchTagCache[tag.toUpperCase()]) {
          state.searchTagCache[tag.toUpperCase()].studentIds.push(student.id);
        }
      }
    },
    pageIsChanged: (state) => {
      const { shouldDisplayStudentIds, nextStartIndex } = state;
      let size = shouldDisplayStudentIds.length - nextStartIndex;
      if (size <= 10) {
        state.hasMore = false;
      } else {
        size = 10;
      }
      state.nextStartIndex += size;
      state.didDisplayStudentIds = shouldDisplayStudentIds.slice(
        0,
        nextStartIndex
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentsRequest.pending, (state) => {
        state.fetchState = 'pending';
      })
      .addCase(fetchStudentsRequest.fulfilled, (state, action) => {
        const students = action.payload;
        state.fetchState = 'idle';
        const studentRecords: Record<string, IStudentLocal> = students.reduce<
          Record<string, IStudentLocal>
        >((res, student) => {
          const studentLocal: IStudentLocal = {
            ...student,
            fullName: `${student.firstName} ${student.lastName}`.toUpperCase(),
            tags: [],
          };
          res[student.id] = studentLocal;
          return res;
        }, {});
        const studentIds = Object.keys(studentRecords);
        state.students = studentRecords;
        state.studentIds = studentIds;
        state.shouldDisplayStudentIds = studentIds;
        let pageSize = studentIds.length;
        if (pageSize <= 10) {
          state.hasMore = false;
        } else {
          pageSize = 10;
        }
        state.nextStartIndex = pageSize;
        state.didDisplayStudentIds = studentIds.slice(0, pageSize);
      })
      .addCase(fetchStudentsRequest.rejected, (state, action) => {
        state.fetchState = 'rejected';
      });
  },
});

export const { searchQueryIsUpdated, studentTagIsAdded, pageIsChanged } =
  studentSlice.actions;
export default studentSlice.reducer;
