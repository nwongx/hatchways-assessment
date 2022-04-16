import type {
  CachedQueryRecord,
  StudentId,
  StudentRecord,
} from './student.interface';
import reducer, {
  queryIsUpdated,
  studentTagIsAdded,
  pageIsChanged,
} from './student.slice';
import { mockState } from './student.slice.mockData';
import {
  getNextPageInfo,
  getQueryInfo,
  getShouldDisplayIdsByName,
  getShouldDisplayIdsByIds,
  getShouldDisplayIdsByTag,
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
  });
});

describe('getShouldDisplayIdsByName', () => {
  test('should return an string array which the id of student fullName contains searching characters regardless of case', () => {
    const students = mockState.students;
    const ids = mockState.ids;
    const upperCaseNameQuery = 'IN';
    const lowerCaseNameQuery = 'in';
    const expectedIds = ['1', '8', '14', '20', '25'];
    expect(
      getShouldDisplayIdsByName(students, ids, upperCaseNameQuery)
    ).toStrictEqual(expectedIds);
    expect(
      getShouldDisplayIdsByName(students, ids, lowerCaseNameQuery)
    ).toStrictEqual(expectedIds);
  });

  test('should return full list when query name is empty', () => {
    const students = mockState.students;
    const ids = mockState.ids;
    const nameQuery = '';
    expect(getShouldDisplayIdsByName(students, ids, nameQuery)).toStrictEqual(
      ids
    );
  });
});

describe('getShouldDisplayIdsByTag', () => {
  test('should return an string array which the id of student tags contain the searching tag regardless of case', () => {
    const students = mockState.students;
    const ids = mockState.ids;
    const upperCaseSearchTag = 't1';
    const lowerCaseNameQuery = 'T1';
    const expectedIds = ['1', '3'];

    expect(
      getShouldDisplayIdsByTag(students, ids, upperCaseSearchTag)
    ).toStrictEqual(expectedIds);
    expect(
      getShouldDisplayIdsByTag(students, ids, lowerCaseNameQuery)
    ).toStrictEqual(expectedIds);
  });

  test('should return full list when query tag is empty', () => {
    const students = mockState.students;
    const ids = mockState.ids;
    const tagQuery = '';

    expect(getShouldDisplayIdsByTag(students, ids, tagQuery)).toStrictEqual(
      ids
    );
  });
});

describe('getShouldDisplayIdsByIds', () => {
  test('should return a non-empty string array', () => {
    const shouldDisplayNameIds = ['1', '8', '14', '20', '25'];
    const shouldDisplayTagIds = ['1', '2', '4', '8'];
    const expectedShouldDisplayIds = ['1', '8'];

    expect(
      getShouldDisplayIdsByIds(shouldDisplayNameIds, shouldDisplayTagIds)
    ).toStrictEqual(expectedShouldDisplayIds);
  });

  test('should return empty string array when at list one of the array is empty', () => {
    const shouldDisplayNameIds = ['1', '8', '14', '20', '25'];
    const shouldDisplayTagIds = ['1', '2', '4', '8'];

    expect(getShouldDisplayIdsByIds([], [])).toStrictEqual([]);
    expect(getShouldDisplayIdsByIds(shouldDisplayNameIds, [])).toStrictEqual(
      []
    );
    expect(getShouldDisplayIdsByIds([], shouldDisplayTagIds)).toStrictEqual([]);
  });
});

describe('getNextPageInfo', () => {
  test('should return param length and hasMore equal false if param length less than than or equal to 10', () => {
    const ids = ['1', '2', '3', '4', '5', '6'];
    const idsEdgeCase = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const expectedInfo = { size: 6, hasMore: false };
    const expectedInfoEdgeCase = { size: 10, hasMore: false };
    expect(getNextPageInfo(ids)).toStrictEqual(expectedInfo);
    expect(getNextPageInfo(idsEdgeCase)).toStrictEqual(expectedInfoEdgeCase);
  });

  test('should return page size is 10 and hasMore false', () => {
    const ids = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const expectedInfo = { size: 10, hasMore: true };
    expect(getNextPageInfo(ids)).toStrictEqual(expectedInfo);
  });
});

describe('getQueryInfo', () => {
  test('should return new queryRefCount and ids', () => {
    const mockGetShouldDisplayIds = jest.fn(
      (students: StudentRecord, ids: StudentId[], name: string) => {
        return getShouldDisplayIdsByName(students, ids, name);
      }
    );
    const students = mockState.students;
    const ids = mockState.ids;
    const queryCacheQueue: string[] = [];
    const queryCache: CachedQueryRecord = {};
    const nameQuery = 'in';
    const expectedRes = {
      queryRefCount: 1,
      shouldDisplayIds: ['1', '8', '14', '20', '25'],
    };

    expect(
      getQueryInfo(
        queryCacheQueue,
        queryCache,
        nameQuery,
        mockGetShouldDisplayIds,
        students,
        ids
      )
    ).toEqual(expectedRes);
    expect(mockGetShouldDisplayIds.mock.calls.length).toBe(1);
  });

  test('should have oldestQuery, oldestQueryRefCount and remaining propties as queue is full', () => {
    const mockGetShouldDisplayIds = jest.fn(
      (students: StudentRecord, ids: StudentId[], name: string) => {
        return getShouldDisplayIdsByName(students, ids, name);
      }
    );
    const students = mockState.students;
    const ids = mockState.ids;
    const queryCacheQueue: string[] = [];
    for (let i = 0; i < 100; i++) {
      queryCacheQueue.push(i % 2 === 0 ? 'IN' : 'I');
    }
    const queryCache: CachedQueryRecord = {
      I: {
        ids: [
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
        ids: ['1', '8', '14', '20', '25'],
        refCount: 50,
      },
    };
    const nameQuery = 'in';
    const expectedRes = {
      oldestQuery: 'IN',
      oldestQueryRefCount: 49,
      queryRefCount: 50,
      shouldDisplayIds: ['1', '8', '14', '20', '25'],
    };

    expect(
      getQueryInfo(
        queryCacheQueue,
        queryCache,
        nameQuery,
        mockGetShouldDisplayIds,
        students,
        ids
      )
    ).toEqual(expectedRes);
    expect(mockGetShouldDisplayIds.mock.calls.length).toBe(0);
  });

  test('should have oldestQuery, oldestQueryRefCount === 0 and remaining propties as queue is full', () => {
    const mockGetShouldDisplayIds = jest.fn(
      (students: StudentRecord, ids: StudentId[], name: string) => {
        return getShouldDisplayIdsByName(students, ids, name);
      }
    );
    const students = mockState.students;
    const ids = mockState.ids;
    const queryCacheQueue: string[] = [];
    queryCacheQueue.push('I');
    for (let i = 1; i < 100; i++) {
      queryCacheQueue.push(i % 2 === 0 ? 'ING' : 'IN');
    }
    const queryCache: CachedQueryRecord = {
      I: {
        ids: [
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
        refCount: 1,
      },
      IN: {
        ids: ['1', '8', '14', '20', '25'],
        refCount: 50,
      },
      ING: {
        ids: ['1', '20'],
        refCount: 49
      }
    };
    const nameQuery = 'ing';
    const expectedRes = {
      oldestQuery: 'I',
      oldestQueryRefCount: 0,
      queryRefCount: 50,
      shouldDisplayIds: ['1', '20'],
    };

    expect(
      getQueryInfo(
        queryCacheQueue,
        queryCache,
        nameQuery,
        mockGetShouldDisplayIds,
        students,
        ids
      )
    ).toEqual(expectedRes);
    expect(mockGetShouldDisplayIds.mock.calls.length).toBe(0);
  });
});

describe('reducer', () => {
  const nameQueryState = produce(mockState, (draft) => {
    (draft.nameQuery = 'in'),
      (draft.nameQueryCache['IN'] = {
        ids: ['1', '8', '14', '20', '25'],
        refCount: 1,
      });
    draft.nameQueryCacheQueue = ['IN'];
    draft.hasMore = false;
    draft.nextStartIndex = 5;
    draft.shouldDisplayIds = ['1', '8', '14', '20', '25'];
    draft.didDisplayIds = ['1', '8', '14', '20', '25'];
  });
  const tagQueryState = produce(mockState, (draft) => {
    (draft.tagQuery = 't1'),
      (draft.tagQueryCache['T1'] = {
        ids: ['1', '3'],
        refCount: 1,
      });
    draft.tagQueryCacheQueue = ['T1'];
    draft.hasMore = false;
    draft.nextStartIndex = 2;
    draft.shouldDisplayIds = ['1', '3'];
    draft.didDisplayIds = ['1', '3'];
  });

  test('should update nameQuery related properties and display student Ids', () => {
    expect(
      reducer(mockState, queryIsUpdated({ type: 'name', value: 'in' }))
    ).toStrictEqual(nameQueryState);
  });

  test('should remove the oldest query in the queue', () => {
    const fullQueueMockState = produce(mockState, (draft) => {
      const queryCacheQueue: string[] = [];
      queryCacheQueue.push('I');
      for (let i = 1; i < 100; i++) {
        queryCacheQueue.push(i % 2 === 0 ? 'ING' : 'IN');
      }
      const queryCache: CachedQueryRecord = {
        I: {
          ids: [
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
          refCount: 1,
        },
        IN: {
          ids: ['1', '8', '14', '20', '25'],
          refCount: 50,
        },
        ING: {
          ids: ['1', '20'],
          refCount: 49
        }
      };
      draft.nameQueryCache = queryCache;
      draft.nameQuery = 'IN',
      draft.nameQueryCacheQueue = queryCacheQueue;
    })
    const expectedState = produce(fullQueueMockState, (draft) => {
      draft.nameQuery = 'ing',
      draft.nameQueryCache = {
        IN: {
          ids: ['1', '8', '14', '20', '25'],
          refCount: 50,
        },
        ING: {
          ids: ['1', '20'],
          refCount: 50,
        }
      };
      draft.nameQueryCacheQueue.shift();
      draft.nameQueryCacheQueue.push('ING');
      draft.shouldDisplayIds = ['1', '20'];
      draft.didDisplayIds = ['1', '20'];
      draft.hasMore = false;
      draft.nextStartIndex = 2;
    })
    expect(reducer(fullQueueMockState, queryIsUpdated({ type: 'name', value: 'ing'}))).toStrictEqual(expectedState);
  })

  test('should update tagQuery related properties and display student Ids', () => {
    expect(
      reducer(mockState, queryIsUpdated({ type: 'tag', value: 't1' }))
    ).toStrictEqual(tagQueryState);
  });

  test('should update both name and Tag properties and display student ids', () => {
    const nameQueryState = reducer(
      mockState,
      queryIsUpdated({ type: 'name', value: 'in' })
    );
    const expectedNameQueryState = produce(mockState, (draft) => {
      draft.nameQuery = 'in';
      draft.nameQueryCache['IN'] = {
        ids: ['1', '8', '14', '20', '25'],
        refCount: 1,
      };
      draft.nameQueryCacheQueue = ['IN'];
      draft.hasMore = false;
      draft.nextStartIndex = 5;
      draft.shouldDisplayIds = ['1', '8', '14', '20', '25'];
      draft.didDisplayIds = ['1', '8', '14', '20', '25'];
    });
    expect(nameQueryState).toStrictEqual(expectedNameQueryState);
    const searchState = reducer(
      nameQueryState,
      queryIsUpdated({ type: 'tag', value: 't1' })
    );
    const expectedState = produce(nameQueryState, (draft) => {
      draft.tagQuery = 't1';
      draft.tagQueryCache['T1'] = {
        ids: ['1', '3'],
        refCount: 1,
      };
      draft.nameQueryCache['IN'].refCount = 2;
      draft.nameQueryCacheQueue.push('IN');
      draft.tagQueryCacheQueue = ['T1'];
      draft.hasMore = false;
      draft.nextStartIndex = 1;
      draft.shouldDisplayIds = ['1'];
      draft.didDisplayIds = ['1'];
    });
    expect(searchState).toStrictEqual(expectedState);
  });

  test('should update student tags array and tag cache array', () => {
    const mockStateWithSearchTagCache = produce(mockState, (draft) => {
      draft.tagQueryCache = {
        T: {
          ids: ['1', '2', '3', '4', '5'],
          refCount: 1,
        },
        T1: {
          ids: ['1', '3'],
          refCount: 1,
        },
      };
      draft.tagQueryCacheQueue = ['T', 'T1'];
    });
    const expectedStateWithSearchTagCache = produce(
      mockStateWithSearchTagCache,
      (draft) => {
        draft.students[5].tags.push('t1');
        draft.tagQueryCache['T1'].ids.push(draft.students[5].id);
      }
    );
    const expectedState = produce(mockStateWithSearchTagCache, (draft) => {
      draft.students[5].tags.push('mock');
    });
    expect(
      reducer(
        mockStateWithSearchTagCache,
        studentTagIsAdded({ id: '5', tag: 't1' })
      )
    ).toStrictEqual(expectedStateWithSearchTagCache);
    expect(
      reducer(
        mockStateWithSearchTagCache,
        studentTagIsAdded({ id: '5', tag: 'mock' })
      )
    ).toStrictEqual(expectedState);
  });

  test('should remove the oldest query in the queue', () => {
    const fullQueueMockState = produce(mockState, (draft) => {
      const queryCacheQueue: string[] = [];
      queryCacheQueue.push('T');
      for (let i = 1; i < 100; i++) {
        queryCacheQueue.push(i % 2 === 0 ? 'T1A' : 'T1');
      }
      const queryCache: CachedQueryRecord = {
        T: {
          ids: [
            '1',
            '2',
            '3',
            '4',
            '5'
          ],
          refCount: 1,
        },
        T1: {
          ids: ['1', '3'],
          refCount: 50,
        },
        T1A: {
          ids: [],
          refCount: 49
        }
      };
      draft.tagQueryCache = queryCache;
      draft.tagQuery = 't1',
      draft.tagQueryCacheQueue = queryCacheQueue;
    })
    const expectedState = produce(fullQueueMockState, (draft) => {
      draft.tagQuery = 't1a',
      draft.tagQueryCache = {
        T1: {
          ids: ['1', '3'],
          refCount: 50,
        },
        T1A: {
          ids: [],
          refCount: 50,
        }
      };
      draft.tagQueryCacheQueue.shift();
      draft.tagQueryCacheQueue.push('T1A');
      draft.shouldDisplayIds = [];
      draft.didDisplayIds = [];
      draft.hasMore = false;
      draft.nextStartIndex = 0;
    })
    expect(reducer(fullQueueMockState, queryIsUpdated({ type: 'tag', value: 't1a'}))).toStrictEqual(expectedState);
  })

  test('should update didDisplayIds', () => {
    const expectedState = produce(mockState, (draft) => {
      draft.didDisplayIds = mockState.shouldDisplayIds.slice(0, 20);
      draft.hasMore = true;
      draft.nextStartIndex = 20;
    });
    const expectedStateSecondPage = produce(mockState, (draft) => {
      draft.didDisplayIds = mockState.shouldDisplayIds;
      draft.hasMore = false;
      draft.nextStartIndex = 25;
    });
    expect(reducer(mockState, pageIsChanged())).toStrictEqual(expectedState);
    expect(reducer(expectedState, pageIsChanged())).toStrictEqual(
      expectedStateSecondPage
    );
  });
});
