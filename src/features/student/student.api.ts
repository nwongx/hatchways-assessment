import axios, { AxiosResponse } from 'axios';
import { IStudentRespond } from '../../interfaces/student';

axios.defaults.baseURL = 'https://api.hatchways.io';


const STUDENTS = '/assessment/students';

export async function fetchStudents(): Promise<AxiosResponse<IStudentRespond>> {
  return axios.get<IStudentRespond>(STUDENTS);
}
