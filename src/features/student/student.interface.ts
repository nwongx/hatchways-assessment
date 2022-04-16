export interface IStudent {
  city: string;
  company: string;
  email: string;
  firstName: string;
  grades: string[];
  id: string;
  lastName: string;
  pic: string;
  skill: string;
}

export interface IStudentLocal extends IStudent {
  fullName: string;
  tags: string[];
}

export interface IStudentRespond {
  students: IStudent[];
}

export type StudentId = string;

export type QueryType = 'name' | 'tag';
export interface IQueryActionPaylod {
  type: QueryType;
  value: string;
}

export interface IAddTagActionPayload {
  id: StudentId,
  tag: string;
}

export interface ICachedMixQuery {
  name: string;
  tag: string;
}

export interface IPage {
  size: number;
  hasMore: boolean;
}

export interface ICachedQueryRes {
  ids: StudentId[];
  refCount: number;
}

export type StudentRecord = Record<StudentId, IStudentLocal>;
export type CachedQueryRecord = Record<string, ICachedQueryRes>;

export type FetchState = 'idle' | 'pending' | 'rejected';

export type GetShouldDisplayIdsFN = (students: StudentRecord, ids: StudentId[], query: string) => StudentId[];
