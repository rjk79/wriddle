import React, { useEffect } from 'react';
import { XIcon } from '@heroicons/react/solid';

const Modal = (props) => {
  const { children, closeModal, modal, onMount } = props;

  useEffect(() => {
    onMount();
  }, []);

  return modal ? (
    <div
      onClick={closeModal}
      className="p-5 w-full h-full flex justify-center items-center fixed z-10 bg-black bg-opacity-50">
      <div
        className="h-full w-full relative bg-white rounded-lg p-5 sm:w-5/6 sm:h-5/6 dark:bg-white dark:text-black"
        onClick={(e) => e.stopPropagation()}>
        <XIcon
          className="z-50 absolute top-5 right-5 w-7 h-7 cursor-pointer"
          onClick={closeModal}
        />
        {children}
      </div>
    </div>
  ) : null;
};

export default Modal;
