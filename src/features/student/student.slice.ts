/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchStudents } from "./student.api";
import {
  getNextPageInfo,
  getMixQuery,
  getQueryInfo,
  getShouldDisplayIdsByName,
  getShouldDisplayIdsByIds,
  getShouldDisplayIdsByTag,
} from "./student.utils";
import type {
  IQueryActionPaylod,
  IStudent,
  IStudentLocal,
  CachedQueryRecord,
  StudentId,
  StudentRecord,
  FetchState,
  IAddTagActionPayload,
} from "./student.interface";
import type { RootState } from "../../app/store";

export interface StudentState {
  fetchState: FetchState;
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
  fetchState: "idle",
  students: {},
  ids: [],
  shouldDisplayIds: [],
  didDisplayIds: [],
  nameQuery: "",
  tagQuery: "",
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
  "student/fetchStudentsRequest",
  async () => {
    const res = await fetchStudents();
    return res.data.students;
  },
  {
    condition: (_, { getState }) => {
      const { fetchState } = getState().student;
      if (fetchState !== "idle") return false;
      return true;
    },
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    /*
      1. get the previous name and tag query in store and merge with new query
      2. if query is not empty string
        - if query exists in lookup table
          - if query ref queue is not full
            - push query to the queue and update refcount
          - else remove oldest queue and push query, and update both queries' refcount
        - else search the ids with query and update the lookup table
        - if both queries are not empty
          - changing one of the ids from the above to lookup table and comparing it
            with another ids
      3.  update page setting and displayIds based on result from 2 
     */
    queryIsUpdated: (state, action: PayloadAction<IQueryActionPaylod>) => {
      const { name, tag } = getMixQuery(
        { name: state.nameQuery, tag: state.tagQuery },
        action.payload
      );

      const upperCaseNameQuery = name.toUpperCase();
      const upperCaseTagQuery = tag.toUpperCase();
      let nameQueryInfo;
      let tagQueryInfo;
      let shouldDisplayIds;
      let shouldDisplayNameIds;
      let shouldDisplayTagIds;

      if (name.length > 0) {
        nameQueryInfo = getQueryInfo(
          state.nameQueryCacheQueue,
          state.nameQueryCache,
          upperCaseNameQuery,
          getShouldDisplayIdsByName,
          state.students,
          state.ids
        );
        const {
          oldestQuery,
          oldestQueryRefCount,
          queryRefCount,
          queryDisplayIds,
        } = nameQueryInfo;
        if (oldestQuery && oldestQueryRefCount !== undefined) {
          if (oldestQueryRefCount === 0) {
            delete state.nameQueryCache[oldestQuery];
            state.nameQueryCacheQueue.shift();
          } else {
            state.nameQueryCache[oldestQuery].refCount = oldestQueryRefCount;
          }
        }
        state.nameQueryCache[upperCaseNameQuery] = {
          ids: queryDisplayIds,
          refCount: queryRefCount,
        };
        state.nameQueryCacheQueue.push(upperCaseNameQuery);
        shouldDisplayNameIds = queryDisplayIds;
      }

      if (tag.length > 0) {
        tagQueryInfo = getQueryInfo(
          state.tagQueryCacheQueue,
          state.tagQueryCache,
          upperCaseTagQuery,
          getShouldDisplayIdsByTag,
          state.students,
          state.ids
        );
        const {
          oldestQuery,
          oldestQueryRefCount,
          queryRefCount,
          queryDisplayIds,
        } = tagQueryInfo;
        if (oldestQuery && oldestQueryRefCount !== undefined) {
          if (oldestQueryRefCount === 0) {
            delete state.tagQueryCache[oldestQuery];
            state.tagQueryCacheQueue.shift();
          } else {
            state.tagQueryCache[oldestQuery].refCount = oldestQueryRefCount;
          }
        }
        state.tagQueryCache[upperCaseTagQuery] = {
          ids: queryDisplayIds,
          refCount: queryRefCount,
        };
        state.tagQueryCacheQueue.push(upperCaseTagQuery);
        shouldDisplayTagIds = queryDisplayIds;
      }

      if (nameQueryInfo && tagQueryInfo) {
        shouldDisplayIds = getShouldDisplayIdsByIds(
          nameQueryInfo.queryDisplayIds,
          tagQueryInfo.queryDisplayIds
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
    studentTagIsAdded: (state, action: PayloadAction<IAddTagActionPayload>) => {
      const { id, tag } = action.payload;
      const student = state.students[id];

      if (!new Set(student.tags).has(tag)) {
        student.tags = [...student.tags, tag];
        if (state.tagQueryCache[tag.toUpperCase()]) {
          state.tagQueryCache[tag.toUpperCase()].ids.push(student.id);
        }
      }
    },
    /*
      based on the remaining shouldDisplayIds
      update the didDisplayIds by at most 10 students everytime
      if the size of next page less than 10 
      the function will not be executed by setting hasmore to false
    */
    pageIsChanged: (state) => {
      const { shouldDisplayIds, nextStartIndex } = state;
      const { size, hasMore } = getNextPageInfo(
        shouldDisplayIds.length - nextStartIndex
      );
      state.hasMore = hasMore;
      state.didDisplayIds = shouldDisplayIds.slice(0, nextStartIndex + size);
      state.nextStartIndex += size;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentsRequest.pending, (state) => {
        state.fetchState = "pending";
      })
      .addCase(fetchStudentsRequest.fulfilled, (state, action) => {
        const students = action.payload;
        state.fetchState = "idle";
        const studentRecords: StudentRecord = students.reduce<StudentRecord>(
          (res, student) => {
            const studentLocal: IStudentLocal = {
              ...student,
              fullName:
                `${student.firstName} ${student.lastName}`.toUpperCase(),
              tags: [],
            };
            res[student.id] = studentLocal;
            return res;
          },
          {}
        );
        const ids = Object.keys(studentRecords);
        state.students = studentRecords;
        state.ids = ids;
        state.shouldDisplayIds = ids;
        const { size, hasMore } = getNextPageInfo(ids);
        state.hasMore = hasMore;
        state.nextStartIndex = size;
        state.didDisplayIds = ids.slice(0, size);
      })
      .addCase(fetchStudentsRequest.rejected, (state) => {
        state.fetchState = "rejected";
      });
  },
});

export const { queryIsUpdated, studentTagIsAdded, pageIsChanged } =
  studentSlice.actions;
export default studentSlice.reducer;
