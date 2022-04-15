import { IStudentLocal } from '../../interfaces/student';
import reducer, {
  listQueryIsUpdated,
  studentTagIsAdded,
  shouldDisplayNextStudentSlot,
} from './student.slice';
import { mockState } from './student.slice.mockData';
import {
  getNextSlotInfo,
  getSearchInfo,
  getShouldDisplayStudentIdsByName,
  getShouldDisplayStudentIdsByStudentIds,
  getShouldDisplayStudentIdsByTag,
} from './student.utils';

test('should return the initial state', () => {
  expect(
    reducer(undefined, {
      type: undefined,
    })
  ).toEqual({
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
  });
});

describe('getShouldDisplayStudentIdsByName', () => {
  test('should return an string array which the id of student fullName contains searching characters regardless of case', () => {
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const upperCaseSearchName = 'IN';
    const lowerCaseSearchName = 'in';
    const expectedStudentIds = ['1', '8', '14', '20', '25'];
    expect(
      getShouldDisplayStudentIdsByName(
        students,
        studentIds,
        upperCaseSearchName
      )
    ).toStrictEqual(expectedStudentIds);
    expect(
      getShouldDisplayStudentIdsByName(
        students,
        studentIds,
        lowerCaseSearchName
      )
    ).toStrictEqual(expectedStudentIds);
  });

  test('should return full list when query name is empty', () => {
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const searchName = '';
    expect(
      getShouldDisplayStudentIdsByName(students, studentIds, searchName)
    ).toStrictEqual(studentIds);
  });
});

describe('getShouldDisplayStudentIdsByTag', () => {
  test('should return an string array which the id of student tags contain the searching tag regardless of case', () => {
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const upperCaseSearchTag = 't1';
    const lowerCaseSearchName = 'T1';
    const expectedStudentIds = ['1', '3'];

    expect(
      getShouldDisplayStudentIdsByTag(students, studentIds, upperCaseSearchTag)
    ).toStrictEqual(expectedStudentIds);
    expect(
      getShouldDisplayStudentIdsByTag(students, studentIds, lowerCaseSearchName)
    ).toStrictEqual(expectedStudentIds);
  });

  test('should return full list when query tag is empty', () => {
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const searchTag = '';

    expect(
      getShouldDisplayStudentIdsByTag(students, studentIds, searchTag)
    ).toStrictEqual(studentIds);
  });
});

describe('getShouldDisplayStudentIdsByStudentIds', () => {
  test('should return a non-empty string array', () => {
    const shouldDisplayNameStudentIds = ['1', '8', '14', '20', '25'];
    const shouldDisplayTagStudentIds = ['1', '2', '4', '8'];
    const expectedShouldDisplayStudentIds = ['1', '8'];

    expect(
      getShouldDisplayStudentIdsByStudentIds(
        shouldDisplayNameStudentIds,
        shouldDisplayTagStudentIds
      )
    ).toStrictEqual(expectedShouldDisplayStudentIds);
  });

  test('should return empty string array when at list one of the array is empty', () => {
    const shouldDisplayNameStudentIds = ['1', '8', '14', '20', '25'];
    const shouldDisplayTagStudentIds = ['1', '2', '4', '8'];

    expect(getShouldDisplayStudentIdsByStudentIds([], [])).toStrictEqual([]);
    expect(
      getShouldDisplayStudentIdsByStudentIds(shouldDisplayNameStudentIds, [])
    ).toStrictEqual([]);
    expect(
      getShouldDisplayStudentIdsByStudentIds([], shouldDisplayTagStudentIds)
    ).toStrictEqual([]);
  });
});

describe('getNextSlotInfo', () => {
  test('should return param length and hasMore equal false if param length less than than or equal to 10', () => {
    const studentIds = ['1', '2', '3', '4', '5', '6'];
    const studentIdsEdgeCase = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ];
    const expectedInfo = { nextSlotSize: 6, hasMore: false };
    const expectedInfoEdgeCase = { nextSlotSize: 10, hasMore: false };
    expect(getNextSlotInfo(studentIds)).toStrictEqual(expectedInfo);
    expect(getNextSlotInfo(studentIdsEdgeCase)).toStrictEqual(
      expectedInfoEdgeCase
    );
  });

  test('should return slot size is 10 and hasMore false', () => {
    const studentIds = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ];
    const expectedInfo = { nextSlotSize: 10, hasMore: true };
    expect(getNextSlotInfo(studentIds)).toStrictEqual(expectedInfo);
  });
});

describe('getSearchInfo', () => {
  test('should return new targetKeyRefCount and studentIds', () => {
    const mockGetShouldDisplayStudentIds = jest.fn(
      (
        students: Record<string, IStudentLocal>,
        studentIds: string[],
        name: string
      ) => {
        return getShouldDisplayStudentIdsByName(students, studentIds, name);
      }
    );
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const searchCacheKeyQueue: string[] = [];
    const searchCache: Record<
      string,
      { studentIds: string[]; refCount: number }
    > = {};
    const searchName = 'in';
    const expectedRes = {
      targetKeyRefCount: 1,
      shouldDisplayStudentIds: ['1', '8', '14', '20', '25'],
    };

    expect(
      getSearchInfo(
        searchCacheKeyQueue,
        searchCache,
        searchName,
        mockGetShouldDisplayStudentIds,
        students,
        studentIds
      )
    ).toEqual(expectedRes);
    expect(mockGetShouldDisplayStudentIds.mock.calls.length).toBe(1);
  });

  test('should have oldestKey, oldestKeyRefCount and remaining propties as queue is full', () => {
    const mockGetShouldDisplayStudentIds = jest.fn(
      (
        students: Record<string, IStudentLocal>,
        studentIds: string[],
        name: string
      ) => {
        return getShouldDisplayStudentIdsByName(students, studentIds, name);
      }
    );
    const students = mockState.student.students;
    const studentIds = mockState.student.studentIds;
    const searchCacheKeyQueue: string[] = [];
    for (let i = 0; i < 100; i++) {
      searchCacheKeyQueue.push(i % 2 === 0 ? 'IN' : 'I');
    }
    const searchCache: Record<
      string,
      { studentIds: string[]; refCount: number }
    > = {
      I: {
        studentIds: [
          '1',
          '4',
          '5',
          '8',
          '9',
          '11',
          '12',
          '13',
          '14',
          '15',
          '17',
          '18',
          '19',
          '20',
          '22',
          '23',
          '24',
          '25',
        ],
        refCount: 50,
      },
      IN: {
        studentIds: ['1', '8', '14', '20', '25'],
        refCount: 50,
      },
    };
    const searchName = 'in';
    const expectedRes = {
      oldestKey: 'IN',
      oldestKeyRefCount: 49,
      targetKeyRefCount: 50,
      shouldDisplayStudentIds: ['1', '8', '14', '20', '25'],
    };

    expect(
      getSearchInfo(
        searchCacheKeyQueue,
        searchCache,
        searchName,
        mockGetShouldDisplayStudentIds,
        students,
        studentIds
      )
    ).toEqual(expectedRes);
    expect(mockGetShouldDisplayStudentIds.mock.calls.length).toBe(0);
  });
});
