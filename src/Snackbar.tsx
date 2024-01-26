import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

const Snackbar = ({ label }) => {
  const [showing, setShowing] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [label]);

  return showing ? (
    <div
      className={classNames(
        ' p-5 w-full h-full flex justify-center items-start pt-64 fixed z-10 bg-black bg-opacity-50'
      )}>
      <div
        className={classNames(
          'relative font-bold text-center text-2xl bg-white bg-opacity-70 rounded-lg p-5 sm:w-1/2 w-full dark:bg-white dark:text-black'
        )}
        onClick={(e) => e.stopPropagation()}>
        {label}
      </div>
    </div>
  ) : null;
};

export default Snackbar;
