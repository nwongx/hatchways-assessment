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

export type SearchQueryActionType = 'name' | 'tag';
export interface ISearchQueryActionPaylod {
  type: SearchQueryActionType;
  value: string;
}

export interface ICachedQuery {
  name: string;
  tag: string;
}

export interface IPage {
  size: number;
  hasMore: boolean;
}
