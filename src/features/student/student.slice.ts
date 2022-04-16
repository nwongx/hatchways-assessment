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
  nameQuery: string;
  tagQuery: string;
  nextStartIndex: number;
  hasMore: boolean;
  nameQueryCache: CachedQueryRecord;
  nameQueryCacheQueue: string[];
  tagQueryCache: CachedQueryRecord;
  tagQueryCacheQueue: string[];
}

const initialState: StudentState = {
  fetchState: 'idle',
  students: {},
  ids: [],
  shouldDisplayIds: [],
  didDisplayIds: [],
  nameQuery: '',
  tagQuery: '',
  nextStartIndex: 0,
  hasMore: true,
  nameQueryCache: {},
  nameQueryCacheQueue: [],
  tagQueryCache: {},
  tagQueryCacheQueue: [],
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
        { name: state.nameQuery, tag: state.tagQuery },
        action.payload
      );

      const upperCaseQueryName = name.toUpperCase();
      const upperCaseQueryTag = tag.toUpperCase();
      let nameQueryInfo,
        tagQueryInfo,
        shouldDisplayIds,
        shouldDisplayNameIds,
        shouldDisplayTagIds;

      if (name.length > 0) {
        nameQueryInfo = getSearchInfo(
          state.nameQueryCacheQueue,
          state.nameQueryCache,
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
        } = nameQueryInfo;
        if (oldestQuery) {
          if (oldestQueryRefCount === 0) {
            delete state.nameQueryCache[oldestQuery];
            state.nameQueryCacheQueue.shift();
          } else {
            state.nameQueryCache[oldestQuery].refCount = oldestQueryRefCount!;
          }
        }
        state.nameQueryCache[upperCaseQueryName] = {
          ids: shouldDisplayIds,
          refCount: queryRefCount,
        };
        state.nameQueryCacheQueue.push(upperCaseQueryName);
        shouldDisplayNameIds = shouldDisplayIds;
      }

      if (tag.length > 0) {
        tagQueryInfo = getSearchInfo(
          state.tagQueryCacheQueue,
          state.tagQueryCache,
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
        } = tagQueryInfo;
        if (oldestQuery) {
          if (oldestQueryRefCount === 0) {
            delete state.tagQueryCache[oldestQuery];
            state.tagQueryCacheQueue.shift();
          } else {
            state.tagQueryCache[oldestQuery].refCount = oldestQueryRefCount!;
          }
        }
        state.tagQueryCache[upperCaseQueryTag] = {
          ids: shouldDisplayIds,
          refCount: queryRefCount,
        };
        state.tagQueryCacheQueue.push(upperCaseQueryTag);
        shouldDisplayTagIds = shouldDisplayIds;
      }

      if (nameQueryInfo && tagQueryInfo) {
        shouldDisplayIds = getShouldDisplayIdsByIds(
          nameQueryInfo.shouldDisplayIds,
          tagQueryInfo.shouldDisplayIds
        );
      } else if (shouldDisplayNameIds) {
        shouldDisplayIds = shouldDisplayNameIds;
      } else if (shouldDisplayTagIds) {
        shouldDisplayIds = shouldDisplayTagIds;
      } else {
        shouldDisplayIds = state.ids;
      }

      state.nameQuery = name;
      state.tagQuery = tag;
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
        if (state.tagQueryCache[tag.toUpperCase()]) {
          state.tagQueryCache[tag.toUpperCase()].ids.push(student.id);
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
