import type {
  ICachedMixQuery,
  IPage,
  IQueryActionPaylod,
  CachedQueryRecord,
  StudentId,
  StudentRecord,
} from './student.interface';

export function getQuery(
  prevQuery: ICachedMixQuery,
  actionPayload: IQueryActionPaylod
): ICachedMixQuery {
  if (actionPayload.type === 'name') {
    return {
      name: actionPayload.value,
      tag: prevQuery.tag,
    };
  }
  return {
    name: prevQuery.name,
    tag: actionPayload.value,
  };
}

export function getNextPageInfo(ids: StudentId[]): IPage {
  if (ids.length <= 10) {
    return { size: ids.length, hasMore: false };
  }
  return { size: 10, hasMore: true };
}

export function getSearchInfo(
  searchCacheKeyQueue: string[],
  searchCache: CachedQueryRecord,
  query: string,
  getShouldDisplayIds: (
    students: StudentRecord,
    ids: StudentId[],
    name: string
  ) => StudentId[],
  students: StudentRecord,
  ids: StudentId[]
) {
  let oldestQuery: string | undefined;
  let oldestQueryRefCount: number | undefined;
  let queryRefCount: number;
  let shouldDisplayIds: StudentId[];
  if (searchCacheKeyQueue.length === 100) {
    //queue is full
    oldestQuery = searchCacheKeyQueue[0];
    oldestQueryRefCount = searchCache[oldestQuery!].refCount - 1;
  }
  query = query.toUpperCase();
  if (searchCache[query]) {
    //name exists in cache
    queryRefCount =
      oldestQuery === query
        ? searchCache[query].refCount
        : searchCache[query].refCount + 1;
    shouldDisplayIds = searchCache[query].ids;
  } else {
    //name doesn't exist in cache
    shouldDisplayIds = getShouldDisplayIds(students, ids, query);
    queryRefCount = 1;
  }

  return {
    oldestQuery,
    oldestQueryRefCount,
    queryRefCount,
    shouldDisplayIds,
  };
}

export function getShouldDisplayIdsByName(
  students: StudentRecord,
  ids: StudentId[],
  name: string
): StudentId[] {
  if (!name || name.length === 0) {
    return ids;
  }
  return ids.reduce<StudentId[]>((res, id) => {
    if (students[id].fullName.includes(name.toUpperCase())) {
      return [...res, id];
    }
    return res;
  }, []);
}

export function getShouldDisplayIdsByTag(
  students: StudentRecord,
  ids: StudentId[],
  tag: string
): StudentId[] {
  if (!tag || tag.length === 0) {
    return ids;
  }
  return ids.reduce<StudentId[]>((res, id) => {
    if (
      students[id].tags.find((addedTag) =>
        addedTag.toUpperCase().includes(tag.toUpperCase())
      )
    ) {
      return [...res, id];
    }
    return res;
  }, []);
}

export function getShouldDisplayIdsByIds(
  shouldDisplayNameIds: StudentId[],
  shouldDisplayTagIds: StudentId[]
) {
  const shouldDisplayNameIdsObj = shouldDisplayNameIds.reduce<
    Record<string, string>
  >((res, id) => ({ ...res, [id]: id }), {});
  return shouldDisplayTagIds.filter((id) => !!shouldDisplayNameIdsObj[id]);
}
