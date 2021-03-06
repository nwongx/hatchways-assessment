import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { studentTagIsAdded } from "../features/student/student.slice";
import { IStudentLocal } from "../features/student/student.interface";
import { average } from "../utils/arithmetic";
import CustomeInput from "./customInput";
import Grade from "./grade";
import Tag from "./tag";
import SubtractIcon from "../icons/subtract";
import AddIcon from "../icons/add";
import { validateTag } from "../utils/string";

type StudentProfileProps = {
  student: IStudentLocal;
};

function StudentProfile({ student }: StudentProfileProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const dispatch = useDispatch();
  const menoizedTagAddedHandler = useCallback(
    function tagAddedHandler(input: string) {
      const trimTag = input.trim();
      if (!validateTag(trimTag)) {
        toast("Invalid Tag", { type: "error" });
      } else {
        dispatch(
          studentTagIsAdded({
            id: student.id,
            tag: trimTag,
          })
        );
      }
    },
    [dispatch, student]
  );
  const { company, email, fullName, grades, pic, skill, tags } = student;

  return (
    <div className="flex-col md:flex-row flex px-6 py-3 gap-10 border-b last:border-b-0 border-b-g">
      <img
        className="mt-3 rounded-full w-32 h-32 border-2 border-gray-250"
        src={pic}
        alt={`${fullName} profile pic`}
      />
      <div className="flex-1">
        <div className="flex justify-between space-x-1">
          <p className=" text-4xl font-bold">{fullName}</p>
          <button
            className="mt-1 w-8 h-8"
            type="button"
            aria-label={isExpanded ? "collapse button" : "expand button"}
            onClick={() => {
              setIsExpanded((prev) => !prev);
            }}
          >
            {isExpanded ? <SubtractIcon /> : <AddIcon />}
          </button>
        </div>
        <div className="px-3 pt-3 text-gray-700">
          <p>
            Email:
            {` ${email}`}
          </p>
          <p>
            Company:
            {` ${company}`}
          </p>
          <p>
            Skill:
            {` ${skill}`}
          </p>
          <p>
            Average:
            {` ${average(grades)}%`}
          </p>
          {isExpanded && (
            <div className="mt-3">
              {grades.map((grade, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Grade key={i} id={i} grade={grade} />
              ))}
            </div>
          )}
          <div className="flex px-0.5 mt-3 gap-2 flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
          <CustomeInput
            placeholder="Add a new tag"
            onKeyUp={menoizedTagAddedHandler}
            targetKeyUp="Enter"
          />
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
