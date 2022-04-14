import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IStudent, IStudentLocal } from '../../interfaces/student';
import { fetchStudents } from './student.api';
import type { RootState } from '../../app/store';

interface StudentState {
  fetchState: 'idle' | 'pending' | 'rejected';
  students: Record<string, IStudentLocal>;
  studentIds: string[];
  shouldDisplayStudentIds: string[];
  didDisplayStudentIds: string[];
  searchName: string;
  searchTag: string;
  nextStudentSlotHeadPtr: number;
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
  nextStudentSlotHeadPtr: 0,
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

function getNextSlotInfo(dataLength: number) {
  if (dataLength <= 10) {
    return { nextSlotSize: dataLength, hasMore: false };
  }
  return { nextSlotSize: 10, hasMore: true };
}

function getSearchInfo(
  searchCacheKeyQueue: string[],
  searchCache: Record<string, { studentIds: string[]; refCount: number }>,
  target: string,
  getShouldDisplayStudentIds: (
    students: Record<string, IStudentLocal>,
    studentIds: string[],
    name: string
  ) => string[],
  students: Record<string, IStudentLocal>,
  studentIds: string[]
) {
  let oldestKey: string | undefined;
  let oldestKeyRefCount: number | undefined;
  let targetKeyRefCount: number;
  let shouldDisplayStudentIds: string[];
  if (searchCacheKeyQueue.length === 100) {
    //queue is full
    oldestKey = searchCacheKeyQueue[0];
    oldestKeyRefCount = searchCache[oldestKey!].refCount - 1;
  }

  if (searchCache[target]) {
    //name exists in cache
    targetKeyRefCount = searchCache[target].refCount + 1;
    shouldDisplayStudentIds = searchCache[target].studentIds;
  } else {
    //name doesn't exist in cache
    shouldDisplayStudentIds = getShouldDisplayStudentIds(
      students,
      studentIds,
      target
    );
    targetKeyRefCount = 1;
  }

  return {
    oldestKey,
    oldestKeyRefCount,
    targetKeyRefCount,
    shouldDisplayStudentIds,
  };
}

function getShouldDisplayStudentIdsByName(
  students: Record<string, IStudentLocal>,
  studentIds: string[],
  name: string
): string[] {
  return studentIds.reduce<string[]>((res, id) => {
    if (students[id].fullName.includes(name)) {
      return [...res, id];
    }
    return res;
  }, []);
}

function getShouldDisplayStudentIdsByTag(
  students: Record<string, IStudentLocal>,
  studentIds: string[],
  tag: string
): string[] {
  return studentIds.reduce<string[]>((res, id) => {
    if (students[id].tags.find((addedTag) => addedTag.toUpperCase().includes(tag))) {
      return [...res, id];
    }
    return res;
  }, []);
}

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    listQueryIsUpdated: (
      state,
      action: PayloadAction<{ type: 'name' | 'tag'; value: string }>
    ) => {
      const query = {
        name: state.searchName,
        tag: state.searchTag,
      };
      const { type, value } = action.payload;
      type === 'name' ? (query.name = value) : (query.tag = value);
      state.searchName = query.name;
      state.searchTag = query.tag;
      if (query.tag.length === 0 && query.name.length === 0) {
        const { studentIds } = state;
        const { nextSlotSize, hasMore } = getNextSlotInfo(studentIds.length);
        state.hasMore = hasMore;
        state.shouldDisplayStudentIds = studentIds;
        state.nextStudentSlotHeadPtr = nextSlotSize;
        state.didDisplayStudentIds = studentIds.slice(0, nextSlotSize);
        return;
      }

      if (query.tag.length === 0) {
        const upperCaseQueryName = query.name.toUpperCase();
        const {
          oldestKey,
          oldestKeyRefCount,
          targetKeyRefCount,
          shouldDisplayStudentIds,
        } = getSearchInfo(
          state.searchNameCacheKeyQueue,
          state.searchNameCache,
          upperCaseQueryName,
          getShouldDisplayStudentIdsByName,
          state.students,
          state.studentIds
        );
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

        state.shouldDisplayStudentIds = shouldDisplayStudentIds;
        const { nextSlotSize, hasMore } = getNextSlotInfo(
          shouldDisplayStudentIds.length
        );
        state.hasMore = hasMore;
        state.nextStudentSlotHeadPtr = nextSlotSize;
        state.didDisplayStudentIds = shouldDisplayStudentIds.slice(
          0,
          nextSlotSize
        );
        return;
      }

      if (query.name.length === 0) {
        const upperCaseQueryTag = query.tag.toUpperCase();
        const {
          oldestKey,
          oldestKeyRefCount,
          targetKeyRefCount,
          shouldDisplayStudentIds,
        } = getSearchInfo(
          state.searchTagCacheKeyQueue,
          state.searchTagCache,
          upperCaseQueryTag,
          getShouldDisplayStudentIdsByTag,
          state.students,
          state.studentIds
        );
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

        state.shouldDisplayStudentIds = shouldDisplayStudentIds;
        const { nextSlotSize, hasMore } = getNextSlotInfo(
          shouldDisplayStudentIds.length
        );
        state.hasMore = hasMore;
        state.nextStudentSlotHeadPtr = nextSlotSize;
        state.didDisplayStudentIds = shouldDisplayStudentIds.slice(
          0,
          nextSlotSize
        );
        return;
      }

      const upperCaseQueryName = query.name.toUpperCase();
      const upperCaseQueryTag = query.tag.toUpperCase();

      const {
        oldestKey: nameOldestKey,
        oldestKeyRefCount: nameOldestKeyRefCount,
        targetKeyRefCount: nameTrageKeyRefCount,
        shouldDisplayStudentIds: shouldDisplayNameStudentIds,
      } = getSearchInfo(
        state.searchNameCacheKeyQueue,
        state.searchNameCache,
        upperCaseQueryName,
        getShouldDisplayStudentIdsByName,
        state.students,
        state.studentIds
      );
      if (nameOldestKey) {
        if (nameOldestKeyRefCount === 0) {
          delete state.searchNameCache[nameOldestKey];
          state.searchNameCacheKeyQueue.shift();
        } else {
          state.searchNameCache[nameOldestKey].refCount = nameOldestKeyRefCount!;
        }
      }
      state.searchNameCache[upperCaseQueryName] = {
        studentIds: shouldDisplayNameStudentIds,
        refCount: nameTrageKeyRefCount,
      };
      state.searchNameCacheKeyQueue.push(upperCaseQueryName);

      const {
        oldestKey: tagOldestKey,
        oldestKeyRefCount: tagOldestKeyRefCount,
        targetKeyRefCount: tagTargetKeyRefCount,
        shouldDisplayStudentIds: shouldDisplayTagStudentIds,
      } = getSearchInfo(
        state.searchTagCacheKeyQueue,
        state.searchTagCache,
        upperCaseQueryTag,
        getShouldDisplayStudentIdsByTag,
        state.students,
        state.studentIds
      );
      if (tagOldestKey) {
        if (tagOldestKeyRefCount === 0) {
          delete state.searchTagCache[tagOldestKey];
          state.searchTagCacheKeyQueue.shift();
        } else {
          state.searchTagCache[tagOldestKey].refCount = tagOldestKeyRefCount!;
        }
      }
      state.searchTagCache[upperCaseQueryTag] = {
        studentIds: shouldDisplayTagStudentIds,
        refCount: tagTargetKeyRefCount,
      };
      state.searchTagCacheKeyQueue.push(upperCaseQueryTag);

      const shouldDisplayNameStudentIdsObj = shouldDisplayNameStudentIds.reduce<
        Record<string, string>
      >((res, id) => ({ ...res, [id]: id }), {});
      const shouldDisplayStudentIds = shouldDisplayTagStudentIds.filter(
        (id) => !!shouldDisplayNameStudentIdsObj[id]
      );
      state.shouldDisplayStudentIds = shouldDisplayStudentIds;
      const { nextSlotSize, hasMore } = getNextSlotInfo(
        shouldDisplayStudentIds.length
      );
      state.hasMore = hasMore;
      state.nextStudentSlotHeadPtr = nextSlotSize;
      state.didDisplayStudentIds = shouldDisplayStudentIds.slice(
        0,
        nextSlotSize
      );
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
    shouldDisplayNextStudentSlot: (state) => {
      let nextSlotSize =
        state.shouldDisplayStudentIds.length - state.nextStudentSlotHeadPtr;
      if (nextSlotSize <= 10) {
        state.hasMore = false;
      } else {
        nextSlotSize = 10;
      }
      state.nextStudentSlotHeadPtr += nextSlotSize;
      state.didDisplayStudentIds = state.shouldDisplayStudentIds.slice(
        0,
        state.nextStudentSlotHeadPtr
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
        let nextSlotSize = studentIds.length;
        if (nextSlotSize <= 10) {
          state.hasMore = false;
        } else {
          nextSlotSize = 10;
        }
        state.nextStudentSlotHeadPtr = nextSlotSize;
        state.didDisplayStudentIds = studentIds.slice(0, nextSlotSize);
      })
      .addCase(fetchStudentsRequest.rejected, (state, action) => {
        state.fetchState = 'rejected';
      });
  },
});

export const {
  listQueryIsUpdated,
  studentTagIsAdded,
  shouldDisplayNextStudentSlot,
} = studentSlice.actions;
export default studentSlice.reducer;
