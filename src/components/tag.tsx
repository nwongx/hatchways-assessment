import React from "react";

type TagProps = {
  tag: string;
};

function Tag({ tag }: TagProps) {
  return (
    <div className="rounded-sm bg-gray-250 px-2.5 py-1 text-sm text-gray-700">
      {tag}
    </div>
  );
}

export default Tag;
