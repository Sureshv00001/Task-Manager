import React, { useState } from 'react';

const StarRating = ({ rating, setRating, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center">
      {[...Array(5)].map((star, index) => {
        index += 1;
        return (
          <button
            type="button"
            key={index}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} bg-transparent border-none outline-none text-2xl transition-colors duration-200`}
            onClick={() => !readOnly && setRating(index)}
            onMouseEnter={() => !readOnly && setHover(index)}
            onMouseLeave={() => !readOnly && setHover(rating)}
          >
            <span className={index <= (hover || rating) ? "text-yellow-400" : "text-gray-300"}>
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
