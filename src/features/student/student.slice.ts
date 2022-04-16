import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchStudents } from './student.api';
import {
  getNextPageInfo,
  getQuery,
  getSearchInfo,
  getShouldDisplayIdsByName,
  getShouldDisplayIdsByIds,
  getShouldDisplayIdsByTag,
} from './student.utils';
import type {
  IQueryActionPaylod,
  IStudent,
  IStudentLocal,
  CachedQueryRecord,
  StudentId,
  StudentRecord,
} from './student.interface';
import type { RootState } from '../../app/store';

export interface StudentState {
  fetchState: 'idle' | 'pending' | 'rejected';
  students: StudentRecord;
  ids: StudentId[];
  shouldDisplayIds: StudentId[];
  didDisplayIds: StudentId[];
  searchName: string;
  searchTag: string;
  nextStartIndex: number;
  hasMore: boolean;
  searchNameCache: CachedQueryRecord;
  searchNameCacheKeyQueue: string[];
  searchTagCache: CachedQueryRecord;
  searchTagCacheKeyQueue: string[];
}

const initialState: StudentState = {
  fetchState: 'idle',
  students: {},
  ids: [],
  shouldDisplayIds: [],
  didDisplayIds: [],
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
    queryIsUpdated: (state, action: PayloadAction<IQueryActionPaylod>) => {
      const { name, tag } = getQuery(
        { name: state.searchName, tag: state.searchTag },
        action.payload
      );

      const upperCaseQueryName = name.toUpperCase();
      const upperCaseQueryTag = tag.toUpperCase();
      let searchNameInfo,
        searchTagInfo,
        shouldDisplayIds,
        shouldDisplayNameIds,
        shouldDisplayTagIds;

      if (name.length > 0) {
        searchNameInfo = getSearchInfo(
          state.searchNameCacheKeyQueue,
          state.searchNameCache,
          upperCaseQueryName,
          getShouldDisplayIdsByName,
          state.students,
          state.ids
        );
        const {
          oldestQuery,
          oldestQueryRefCount,
          queryRefCount,
          shouldDisplayIds,
        } = searchNameInfo;
        if (oldestQuery) {
          if (oldestQueryRefCount === 0) {
            delete state.searchNameCache[oldestQuery];
            state.searchNameCacheKeyQueue.shift();
          } else {
            state.searchNameCache[oldestQuery].refCount = oldestQueryRefCount!;
          }
        }
        state.searchNameCache[upperCaseQueryName] = {
          ids: shouldDisplayIds,
          refCount: queryRefCount,
        };
        state.searchNameCacheKeyQueue.push(upperCaseQueryName);
        shouldDisplayNameIds = shouldDisplayIds;
      }

      if (tag.length > 0) {
        searchTagInfo = getSearchInfo(
          state.searchTagCacheKeyQueue,
          state.searchTagCache,
          upperCaseQueryTag,
          getShouldDisplayIdsByTag,
          state.students,
          state.ids
        );
        const {
          oldestQuery,
          oldestQueryRefCount,
          queryRefCount,
          shouldDisplayIds,
        } = searchTagInfo;
        if (oldestQuery) {
          if (oldestQueryRefCount === 0) {
            delete state.searchTagCache[oldestQuery];
            state.searchTagCacheKeyQueue.shift();
          } else {
            state.searchTagCache[oldestQuery].refCount = oldestQueryRefCount!;
          }
        }
        state.searchTagCache[upperCaseQueryTag] = {
          ids: shouldDisplayIds,
          refCount: queryRefCount,
        };
        state.searchTagCacheKeyQueue.push(upperCaseQueryTag);
        shouldDisplayTagIds = shouldDisplayIds;
      }

      if (searchNameInfo && searchTagInfo) {
        shouldDisplayIds = getShouldDisplayIdsByIds(
          searchNameInfo.shouldDisplayIds,
          searchTagInfo.shouldDisplayIds
        );
      } else if (shouldDisplayNameIds) {
        shouldDisplayIds = shouldDisplayNameIds;
      } else if (shouldDisplayTagIds) {
        shouldDisplayIds = shouldDisplayTagIds;
      } else {
        shouldDisplayIds = state.ids;
      }

      state.searchName = name;
      state.searchTag = tag;
      state.shouldDisplayIds = shouldDisplayIds;
      const { size, hasMore } = getNextPageInfo(shouldDisplayIds);
      state.hasMore = hasMore;
      state.nextStartIndex = size;
      state.didDisplayIds = shouldDisplayIds.slice(0, size);
    },
    studentTagIsAdded: (
      state,
      action: PayloadAction<{ id: string; tag: string }>
    ) => {
      const { id, tag } = action.payload;
      const student = state.students[id];

      if (!new Set(student.tags).has(tag)) {
        student.tags = [...student.tags, tag];
        if (state.searchTagCache[tag.toUpperCase()]) {
          state.searchTagCache[tag.toUpperCase()].ids.push(student.id);
        }
      }
    },
    pageIsChanged: (state) => {
      const { shouldDisplayIds, nextStartIndex } = state;
      let size = shouldDisplayIds.length - nextStartIndex;
      if (size <= 10) {
        state.hasMore = false;
      } else {
        size = 10;
      }
      state.didDisplayIds = shouldDisplayIds.slice(0, nextStartIndex + size);
      state.nextStartIndex += size;
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
        const ids = Object.keys(studentRecords);
        state.students = studentRecords;
        state.ids = ids;
        state.shouldDisplayIds = ids;
        let pageSize = ids.length;
        if (pageSize <= 10) {
          state.hasMore = false;
        } else {
          pageSize = 10;
        }
        state.nextStartIndex = pageSize;
        state.didDisplayIds = ids.slice(0, pageSize);
      })
      .addCase(fetchStudentsRequest.rejected, (state, action) => {
        state.fetchState = 'rejected';
      });
  },
});

export const { queryIsUpdated, studentTagIsAdded, pageIsChanged } =
  studentSlice.actions;
export default studentSlice.reducer;
