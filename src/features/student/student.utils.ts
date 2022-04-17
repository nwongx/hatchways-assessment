import type {
  ICachedMixQuery,
  IPage,
  IQueryActionPaylod,
  CachedQueryRecord,
  StudentId,
  StudentRecord,
  GetShouldDisplayIdsFN,
} from "./student.interface";

import { QUEUE_SIZE, PAGE_SIZE } from "../../utils/constant";

export function getMixQuery(
  prevQuery: ICachedMixQuery,
  actionPayload: IQueryActionPaylod
): ICachedMixQuery {
  if (actionPayload.type === "name") {
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

export function getNextPageInfo(sizeSource: StudentId[] | number): IPage {
  const size = Array.isArray(sizeSource) ? sizeSource.length : sizeSource;
  if (size <= PAGE_SIZE) {
    return { size, hasMore: false };
  }
  return { size: PAGE_SIZE, hasMore: true };
}

export function getQueryInfo(
  queryCacheQueue: string[],
  queryCache: CachedQueryRecord,
  query: string,
  getShouldDisplayIds: GetShouldDisplayIdsFN,
  students: StudentRecord,
  ids: StudentId[]
) {
  let oldestQuery: string | undefined;
  let oldestQueryRefCount: number | undefined;
  let queryRefCount: number;
  let queryDisplayIds: StudentId[];
  if (queryCacheQueue.length === QUEUE_SIZE) {
    // queue is full
    [oldestQuery] = queryCacheQueue;
    oldestQueryRefCount = queryCache[oldestQuery].refCount - 1;
  }
  const upperCaseQuery = query.toUpperCase();
  if (queryCache[upperCaseQuery]) {
    // name exists in cache
    queryRefCount =
      oldestQuery === upperCaseQuery
        ? queryCache[upperCaseQuery].refCount
        : queryCache[upperCaseQuery].refCount + 1;
    queryDisplayIds = queryCache[upperCaseQuery].ids;
  } else {
    // name doesn't exist in cache
    queryDisplayIds = getShouldDisplayIds(students, ids, upperCaseQuery);
    queryRefCount = 1;
  }

  return {
    oldestQuery,
    oldestQueryRefCount,
    queryRefCount,
    queryDisplayIds,
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
    Record<StudentId, StudentId>
  >((res, id) => ({ ...res, [id]: id }), {});
  return shouldDisplayTagIds.filter((id) => !!shouldDisplayNameIdsObj[id]);
}
