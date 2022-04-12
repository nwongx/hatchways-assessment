import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { IStudent, IStudentLocal, } from "../../interfaces/student";
import { fetchStudents } from "./student.api";

interface StudentState {
  fetchState: "idle" | "pending" | "rejected";
  students: Record<string, IStudentLocal>;
  studentIds: string[];
  shouldDisplayStudentIds: string[];
  didDisplayStudentIds: string[];
  searchName: string;
  searchTag: string;
  nextStudentSlotHeadPtr: number;
  hasMore: boolean;
}

const initialState: StudentState = {
  fetchState: "idle",
  students: {},
  studentIds: [],
  shouldDisplayStudentIds: [],
  didDisplayStudentIds: [],
  searchName: "",
  searchTag: "",
  nextStudentSlotHeadPtr: 0,
  hasMore: true,
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
    },
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    listQueryIsUpdated: (
      state,
      action: PayloadAction<{ type: "name" | "tag"; value: string }>
    ) => {
      const query = {
        name: state.searchName,
        tag: state.searchTag,
      };
      const { type, value } = action.payload;
      type === "name" ? (query.name = value) : (query.tag = value);
      state.searchName = query.name;
      state.searchTag = query.tag;
      if (query.tag.length === 0 && query.name.length === 0) {
        state.shouldDisplayStudentIds = state.studentIds;
        return;
      }
      if (query.tag.length === 0) {
        const UpperCaseQueryName = query.name.toUpperCase();
        state.shouldDisplayStudentIds = state.studentIds.reduce<string[]>(
          (res, id) => {
            if (state.students[id].fullName.includes(UpperCaseQueryName)) {
              return [...res, id];
            }
            return res;
          },
          []
        );
        return;
      }
      if (query.name.length === 0) {
        const upperCaseQueryTag = query.tag.toUpperCase();
        state.shouldDisplayStudentIds = state.studentIds.reduce<string[]>(
          (res, id) => {
            const student = state.students[id];
            const matchTags = student.tags.filter((tag) =>
              tag.toUpperCase().includes(upperCaseQueryTag)
            );
            if (matchTags.length > 0) {
              return [...res, id];
            }
            return res;
          },
          []
        );
        return;
      }

      const lowerCaseQueryName = query.name.toUpperCase();
      const matchNameStudentIds = state.studentIds.reduce<string[]>(
        (res, id) => {
          if (state.students[id].fullName.includes(lowerCaseQueryName)) {
            return [...res, id];
          }
          return res;
        },
        []
      );
      const upperCaseQueryTag = query.tag.toUpperCase();
      state.shouldDisplayStudentIds = matchNameStudentIds.reduce<string[]>(
        (res, id) => {
          const student = state.students[id];
          const matchTags = student.tags.filter((tag) =>
            tag.toUpperCase().includes(upperCaseQueryTag)
          );
          if (matchTags.length > 0) {
            return [...res, id];
          }
          return res;
        },
        []
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
        throw new Error("Student not found");
      }
      if (tag.length === 0) {
        // TODO: error handling
        throw new Error("Tag cannot be empty");
      }
      student.tags = [...student.tags, tag];
    },
    shouldDisplayNextStudentSlot: (state) => {
      let nextSlotSize = state.shouldDisplayStudentIds.length - state.nextStudentSlotHeadPtr;
      if (nextSlotSize <= 10) {
        state.hasMore = false;
      } else {
        nextSlotSize = 10;
      }
      state.nextStudentSlotHeadPtr = state.nextStudentSlotHeadPtr + nextSlotSize;
      state.didDisplayStudentIds = state.shouldDisplayStudentIds.slice(0, state.nextStudentSlotHeadPtr)

    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentsRequest.pending, (state) => {
        state.fetchState = "pending";
      })
      .addCase(fetchStudentsRequest.fulfilled, (state, action) => {
        const students = action.payload;
        state.fetchState = "idle";
        const studentRecords: Record<string, IStudentLocal> = students.reduce<Record<string, IStudentLocal>>((res, student) => {
          const studentLocal: IStudentLocal = {
            ...student,
            fullName: `${student.firstName} ${student.lastName}`.toUpperCase(),
            tags: [],
          }
          res[student.id] = studentLocal;
          return res;
        }, {})
        const studentIds = Object.keys(studentRecords);
        state.students = studentRecords;
        state.studentIds = studentIds;
        state.shouldDisplayStudentIds = studentIds;
        console.log(studentIds)
        let nextSlotSize = studentIds.length;
        if (nextSlotSize <= 10) {
          state.hasMore = false;
        } else {
          nextSlotSize = 10;
        }
        state.nextStudentSlotHeadPtr = nextSlotSize;
        state.didDisplayStudentIds = studentIds.slice(0, nextSlotSize)
        console.log(nextSlotSize, studentIds, studentIds.slice(0, nextSlotSize));

      })
      .addCase(fetchStudentsRequest.rejected, (state, action) => {
        state.fetchState = "rejected";
        console.log(action);
      });
  },
});

export const { listQueryIsUpdated, studentTagIsAdded, shouldDisplayNextStudentSlot } = studentSlice.actions;
export default studentSlice.reducer;
