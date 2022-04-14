import React, { FC, useState } from 'react';
import { useDispatch } from 'react-redux';
import { studentTagIsAdded } from '../features/student/student.slice';
import { IStudentLocal } from '../interfaces/student';
import { average } from '../utils/arithmetic';
import CustomeInput from './customInput';
import Grade from './grade';
import Tag from './tag';
import SubtractIcon from '../icons/subtract';
import AddIcon from '../icons/add';

type StudentProfileProps = {
  student: IStudentLocal;
};

const StudentProfile: FC<StudentProfileProps> = ({ student }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const dispatch = useDispatch();
  const { company, email, fullName, grades, pic, skill, tags } = student;

  return (
    <div className="px-6 py-3 flex flex-row gap-10 border-b last:border-b-0 border-b-g">
      <img
        className="mt-3 rounded-full w-32 h-32 border-2 border-gray-250"
        src={pic}
        alt={`${fullName} profile pic`}
      />
      <div className="flex-1">
        <p className=" text-4xl font-bold">{fullName}</p>
        <div className="px-3 pt-3 text-gray-700">
          <p>
            Email:
            {email}
          </p>
          <p>
            Company:
            {company}
          </p>
          <p>
            Skill:
            {skill}
          </p>
          <p>
            Average:
            {`${average(grades)}%`}
          </p>
          {isExpanded && (
            <div className="mt-3">
              {grades.map((grade, i) => (
                <Grade key={i} id={i} grade={grade} />
              ))}
            </div>
          )}
          <div className="flex px-0.5 mt-1 space-x-1 space-y-1">
            {tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
          <CustomeInput
            placeholder="Add a new tag"
            onKeyUp={(input) => {
              dispatch(studentTagIsAdded({ id: student.id, tag: input }));
            }}
            targetKeyUp="Enter"
          />
        </div>
      </div>
      <button
        className="mt-1 w-8 h-8 self-baseline"
        onClick={() => {
          setIsExpanded((prev) => !prev);
        }}
      >
        {isExpanded ? <SubtractIcon /> : <AddIcon />}
      </button>
    </div>
  );
};

export default StudentProfile;
