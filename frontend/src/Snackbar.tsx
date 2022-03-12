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

  return (
    <div
      className={classNames(
        'pointer-events-none p-5 w-full h-full flex justify-center items-center fixed z-10 bg-black bg-opacity-50',
        {
          'transition bg-opacity-0': !showing
        }
      )}>
      <div
        className={classNames(
          'pointer-events-none w-full relative font-bold text-center text-2xl bg-white bg-opacity-70 rounded-lg p-5 sm:w-5/6 dark:bg-white dark:text-black',
          {
            'opacity-0 transition': !showing
          }
        )}
        onClick={(e) => e.stopPropagation()}>
        {label}
      </div>
    </div>
  );
};

export default Snackbar;
