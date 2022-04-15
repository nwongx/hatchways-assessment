import { IStudentLocal } from '../../interfaces/student';

export function getNextSlotInfo(ids: string[]) {
  if (ids.length <= 10) {
    return { nextSlotSize: ids.length, hasMore: false };
  }
  return { nextSlotSize: 10, hasMore: true };
}

export function getSearchInfo(
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
  target = target.toUpperCase();
  if (searchCache[target]) {
    //name exists in cache
    targetKeyRefCount =
      oldestKey === target
        ? searchCache[target].refCount
        : searchCache[target].refCount + 1;
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

export function getShouldDisplayStudentIdsByName(
  students: Record<string, IStudentLocal>,
  studentIds: string[],
  name: string
): string[] {
  if (!name || name.length === 0) {
    return studentIds;
  }
  return studentIds.reduce<string[]>((res, id) => {
    if (students[id].fullName.includes(name.toUpperCase())) {
      return [...res, id];
    }
    return res;
  }, []);
}

export function getShouldDisplayStudentIdsByTag(
  students: Record<string, IStudentLocal>,
  studentIds: string[],
  tag: string
): string[] {
  if (!tag || tag.length === 0) {
    return studentIds;
  }
  return studentIds.reduce<string[]>((res, id) => {
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

export function getShouldDisplayStudentIdsByStudentIds(
  shouldDisplayNameStudentIds: string[],
  shouldDisplayTagStudentIds: string[],
) {
  const shouldDisplayNameStudentIdsObj = shouldDisplayNameStudentIds.reduce<
    Record<string, string>
  >((res, id) => ({ ...res, [id]: id }), {});
  return shouldDisplayTagStudentIds.filter(
    (id) => !!shouldDisplayNameStudentIdsObj[id]
  );
}
