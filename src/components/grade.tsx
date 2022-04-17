import React from "react";

type GradeProps = {
  id: number;
  grade: string;
};

function Grade({ id, grade }: GradeProps) {
  return (
    <div className="grid grid-flow-col auto-cols-max gap-7 leading-4">
      <div>{`Test ${id + 1}:`}</div>
      <div>{`${grade}%`}</div>
    </div>
  );
}

export default Grade;
