import { IStudentLocal } from './student.interface';
import reducer, {
  searchQueryIsUpdated,
  studentTagIsAdded,
  pageIsChanged,
} from './student.slice';
import { mockState } from './student.slice.mockData';
import {
  getNextPageInfo,
  getSearchInfo,
  getShouldDisplayStudentIdsByName,
  getShouldDisplayStudentIdsByStudentIds,
  getShouldDisplayStudentIdsByTag,
} from './student.utils';
import produce from 'immer';

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
    nextStartIndex: 0,
    hasMore: true,
    searchNameCache: {},
    searchNameCacheKeyQueue: [],
    searchTagCache: {},
    searchTagCacheKeyQueue: [],
  });
});

describe('getShouldDisplayStudentIdsByName', () => {
  test('should return an string array which the id of student fullName contains searching characters regardless of case', () => {
    const students = mockState.students;
    const studentIds = mockState.studentIds;
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
    const students = mockState.students;
    const studentIds = mockState.studentIds;
    const searchName = '';
    expect(
      getShouldDisplayStudentIdsByName(students, studentIds, searchName)
    ).toStrictEqual(studentIds);
  });
});

describe('getShouldDisplayStudentIdsByTag', () => {
  test('should return an string array which the id of student tags contain the searching tag regardless of case', () => {
    const students = mockState.students;
    const studentIds = mockState.studentIds;
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
    const students = mockState.students;
    const studentIds = mockState.studentIds;
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

describe('getNextPageInfo', () => {
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
    const expectedInfo = { size: 6, hasMore: false };
    const expectedInfoEdgeCase = { size: 10, hasMore: false };
    expect(getNextPageInfo(studentIds)).toStrictEqual(expectedInfo);
    expect(getNextPageInfo(studentIdsEdgeCase)).toStrictEqual(
      expectedInfoEdgeCase
    );
  });

  test('should return page size is 10 and hasMore false', () => {
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
    const expectedInfo = { size: 10, hasMore: true };
    expect(getNextPageInfo(studentIds)).toStrictEqual(expectedInfo);
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
    const students = mockState.students;
    const studentIds = mockState.studentIds;
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
    const students = mockState.students;
    const studentIds = mockState.studentIds;
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

describe('reducer', () => {
  const searchNameState = produce(mockState, (draft) => {
    (draft.searchName = 'in'),
      (draft.searchNameCache['IN'] = {
        studentIds: ['1', '8', '14', '20', '25'],
        refCount: 1,
      });
    draft.searchNameCacheKeyQueue = ['IN'];
    draft.hasMore = false;
    draft.nextStartIndex = 5;
    draft.shouldDisplayStudentIds = ['1', '8', '14', '20', '25'];
    draft.didDisplayStudentIds = ['1', '8', '14', '20', '25'];
  });
  const searchTagState = produce(mockState, (draft) => {
    (draft.searchTag = 't1'),
      (draft.searchTagCache['T1'] = {
        studentIds: ['1', '3'],
        refCount: 1,
      });
    draft.searchTagCacheKeyQueue = ['T1'];
    draft.hasMore = false;
    draft.nextStartIndex = 2;
    draft.shouldDisplayStudentIds = ['1', '3'];
    draft.didDisplayStudentIds = ['1', '3'];
  });

  test('should update searchName related properties and display student Ids', () => {
    expect(
      reducer(mockState, searchQueryIsUpdated({ type: 'name', value: 'in' }))
    ).toStrictEqual(searchNameState);
  });

  test('should update searchTag related properties and display student Ids', () => {
    expect(
      reducer(mockState, searchQueryIsUpdated({ type: 'tag', value: 't1' }))
    ).toStrictEqual(searchTagState);
  });

  test('should update both name and Tag properties and display student ids', () => {
    const searchNameState = reducer(
      mockState,
      searchQueryIsUpdated({ type: 'name', value: 'in' })
    );
    const expectedSearchNameState = produce(mockState, (draft) => {
      draft.searchName = 'in';
      draft.searchNameCache['IN'] = {
        studentIds: ['1', '8', '14', '20', '25'],
        refCount: 1,
      };
      draft.searchNameCacheKeyQueue = ['IN'];
      draft.hasMore = false;
      draft.nextStartIndex = 5;
      draft.shouldDisplayStudentIds = ['1', '8', '14', '20', '25'];
      draft.didDisplayStudentIds = ['1', '8', '14', '20', '25'];
    });
    expect(searchNameState).toStrictEqual(expectedSearchNameState);
    const searchState = reducer(
      searchNameState,
      searchQueryIsUpdated({ type: 'tag', value: 't1' })
    );
    const expectedState = produce(searchNameState, (draft) => {
      draft.searchTag = 't1';
      draft.searchTagCache['T1'] = {
        studentIds: ['1', '3'],
        refCount: 1,
      };
      draft.searchNameCache['IN'].refCount = 2;
      draft.searchNameCacheKeyQueue.push('IN');
      draft.searchTagCacheKeyQueue = ['T1'];
      draft.hasMore = false;
      draft.nextStartIndex = 1;
      draft.shouldDisplayStudentIds = ['1'];
      draft.didDisplayStudentIds = ['1'];
    });
    expect(searchState).toStrictEqual(expectedState);
  });
});
