import React, { FC } from "react";

type GradeProps = {
  id: number;
  grade: string;
};

const Grade: FC<GradeProps> = ({ id, grade }) => {
  return (
    <div className="grid grid-flow-col auto-cols-max gap-7 leading-4">
      <div>{`Test ${id + 1}:`}</div>
      <div>{`${grade}%`}</div> 
    </div>
  )
};

export default Grade;