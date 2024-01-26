import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChartBarIcon, QuestionMarkCircleIcon, MoonIcon, SunIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import ConfettiGenerator from 'confetti-js';
import { motion } from 'framer-motion';

import Modal from './Modal';
import Snackbar from './Snackbar.tsx';
import {
  words,
  victoryMessages,
  GAME_LOST,
  GAME_WON,
  CORRECT_POSITION,
  WRONG_POSITION,
  WRONG,
  KEYBOARD_UNGUESSED_COLOR,
  keyboardRows
} from './constants';

const Board = () => {
  const characterClassName = 'border-2 border-black dark:border-white';
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [current, setCurrent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [streak, setStreak] = useState(0);
  const [quotes, setQuotes] = useState([]);
  const [quote, setQuote] = useState({});
  const [chosenName, setChosenName] = useState('');
  const [scores, setScores] = useState([]);
  const [modal, setModal] = useState(null);
  const [nightMode, setNightMode] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');

  useEffect(() => {
    resetWord();
    loadStreak();
    getQuotes();
    getScores();
  }, []);

  useEffect(() => {
    if (quotes.length) {
      const index = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[index]);
    }
  }, [quotes, answer]);

  useEffect(() => {
    if (feedback === GAME_WON) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      saveStreak(newStreak);
    } else if (feedback === GAME_LOST) {
      setStreak(0);
      saveStreak(0);
    }
  }, [feedback]);

  async function getScores() {
    const res = await axios.get('/api/scores');
    setScores(res.data);
  }

  useEffect(() => {
    const confettiSettings = { target: 'my-canvas' };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

    return () => confetti.clear();
  }, []);

  async function saveScore(streak) {
    const existingScore = scores.find(
      (score) => score.name.toLowerCase() === chosenName.toLowerCase()
    );
    if (chosenName && existingScore && existingScore.value < streak) {
      axios
        .patch(`/api/scores/${existingScore._id}`, {
          value: String(streak)
        })
        .then(() => getScores());
    } else if (chosenName && !existingScore) {
      axios
        .post('/api/scores', {
          name: chosenName,
          value: String(streak)
        })
        .then(() => getScores());
    }
  }

  function getWords() {
    const items = [];
    for (let i = 0; i < 6; i++) {
      const newItem =
        i < attempts.length ? (
          <div key={i} className="word revealed">
            {attempts[i].map((char, index) => (
              <motion.div
                key={index}
                animate={{ rotateY: [180, 90, 0] }}
                className="flex items-center"
                transition={{ duration: 0.5, delay: index * 0.5 }}>
                <motion.span
                  animate={{ backgroundColor: ['transparent', getColor(char, index)] }}
                  transition={{ duration: 0.5, delay: index * 0.5 + 0.25 }}
                  style={{
                    color: 'white'
                  }}
                  className={classNames('character', characterClassName)}>
                  {/* back of card */}
                  <motion.div
                    animate={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0, delay: index * 0.5 + 0.25 }}
                    style={{ rotateY: 180 }}
                    className="absolute w-full text-black dark:text-white text-center">
                    {char}
                  </motion.div>
                  {/* front of card */}
                  <motion.div
                    animate={{ opacity: [0, 1] }}
                    transition={{ duration: 0, delay: index * 0.5 + 0.25 }}
                    className="absolute w-full text-white text-center">
                    {char}
                  </motion.div>
                </motion.span>
              </motion.div>
            ))}
          </div>
        ) : i === attempts.length ? (
          <div key={i} className="word">
            {getCurrent()}
          </div>
        ) : (
          <div key={i} className="word">
            {Array(5).fill(<span className={classNames('character', characterClassName)}></span>)}
          </div>
        );

      items.push(newItem);
    }

    return items;
  }

  function getCurrent() {
    const items = [];
    for (let i = 0; i < 5; i++) {
      if (i < current.length) {
        items.push(
          <span className={classNames('character', characterClassName)} key={i}>
            {current[i]}
          </span>
        );
      } else {
        items.push(<span className={classNames('character', characterClassName)} key={i}></span>);
      }
    }
    return <>{items}</>;
  }

  function loadStreak() {
    const streak = window.localStorage.getItem('wriddleStreak');

    if (streak) {
      setStreak(Number(streak));
    }
  }

  function saveStreak(streak) {
    window.localStorage.setItem('wriddleStreak', streak);

    // saveScore(streak);
  }

  function newGame() {
    setAttempts([]);
    setFeedback('');
    resetWord();
  }

  function resetWord() {
    const index = Math.floor(Math.random() * words.length);
    setAnswer(words[index].toLowerCase());
  }

  function getColor(char, index) {
    return answer[index] === char
      ? CORRECT_POSITION
      : answer.includes(char)
      ? WRONG_POSITION
      : WRONG;
  }

  async function onSubmit(e) {
    e.preventDefault();

    if ([GAME_LOST, GAME_WON].includes(feedback)) {
      return;
    }

    const res = await checkWord();
    if (res.status === 404) {
      setFeedback(`Sorry, ${current} is not a word`);
    } else if (res.status === 200) {
      if (current.length === 5) {
        const coloredCurrent = current.split('');
        const newAttempts = [...attempts, coloredCurrent];

        setAttempts(newAttempts);
        setCurrent('');
        setFeedback('');
        if (current === answer) {
          setFeedback(GAME_WON);
          pickSnackbar();
        } else if (newAttempts.length === 6) {
          setFeedback(GAME_LOST);
        }
      } else {
        setFeedback('Attempt must be 5 letters');
      }
    } else {
      setFeedback('Word check failed. Please try again');
    }
  }

  function pickSnackbar() {
    const index = Math.floor(Math.random() * victoryMessages.length);
    setSnackbarText(`${victoryMessages[index]}!`);
  }

  async function checkWord() {
    if (words.map((word) => word.toLowerCase()).includes(current))
      return Promise.resolve({
        status: 200
      });

    const request = new Request(`https://api.dictionaryapi.dev/api/v2/entries/en/${current}`, {
      method: 'GET'
    });

    return fetch(request);
  }

  function getKeyboard() {
    return (
      <div className="keyboard">
        {keyboardRows.map((row, index) => (
          <div key={index}>
            {index === keyboardRows.length - 1 && (
              <button
                className="keyboard-command"
                onClick={() => setCurrent(current.slice(0, current.length - 1))}>
                DEL
              </button>
            )}
            {getKeyboardRow(row)}
            {index === keyboardRows.length - 1 && (
              <button className="keyboard-command" onClick={onSubmit}>
                ENTER
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  function getKeyboardRow(row) {
    const letterColorMap = getLetterColorMap();

    return row.map((char, index) => (
      <button
        key={index}
        className="keyboard-character"
        style={{
          color: letterColorMap[char] === KEYBOARD_UNGUESSED_COLOR ? 'black' : 'white',
          backgroundColor:
            letterColorMap[char] !== KEYBOARD_UNGUESSED_COLOR ? letterColorMap[char] : 'white'
        }}
        onClick={() => setCurrent(current + char)}>
        {char}
      </button>
    ));
  }

  function getLetterColorMap() {
    const allLetters = keyboardRows.reduce((acc, curr) => [...acc, ...curr], []);

    const letterColorMap = {};

    const LETTER_RANKING = [KEYBOARD_UNGUESSED_COLOR, WRONG, WRONG_POSITION, CORRECT_POSITION];

    allLetters.forEach((char) => (letterColorMap[char] = KEYBOARD_UNGUESSED_COLOR));

    attempts.forEach((attempt) => {
      attempt.forEach((char, index) => {
        let color = getColor(char, index);
        const currentColor = letterColorMap[char];

        if (LETTER_RANKING.indexOf(color) > LETTER_RANKING.indexOf(currentColor)) {
          letterColorMap[char] = color;
        }
      });
    });

    return letterColorMap;
  }

  async function getQuotes() {
    const res = await fetch('https://type.fit/api/quotes');
    const response = await res.json();
    setQuotes(response.slice(0, 400));
  }

  const modalContent =
    modal === 'instructions' ? (
      <div className="instructions">
        <h2 className="font-bold text-2xl">Instructions:</h2>
        <div>
          Try to guess the word! It{`'`}s like Mastermind and you have 6 guesses. After you guess:
          <ul>
            <li>
              If a letter is not in the word, it will appear{' '}
              <strong style={{ color: WRONG }}>{WRONG}</strong>
            </li>
            <li>
              If a letter is in the word but is not in the right spot, it will appear{' '}
              <strong style={{ color: WRONG_POSITION }}>orange</strong>
            </li>
            <li>
              If a letter is in the word and in the right spot, it will appear{' '}
              <strong style={{ color: CORRECT_POSITION }}>{CORRECT_POSITION}</strong>
            </li>
          </ul>
        </div>
      </div>
    ) : modal === 'high-scores' ? (
      <div className="space-y-4">
        <div className="font-bold text-2xl">High Scores</div>
        <div className="divide-y-2 divide-blue-100">
          {scores.slice(0, 4).map((score, index) => (
            <div key={index} className="py-2 flex">
              <div className="shrink-0">
                {index + 1}
                {`.`}
                {index === 0 && <>🥇</>}
                {index === 1 && <>🥈</>}
                {index === 2 && <>🥉</>}
              </div>
              <span className="ml-2 flex justify-between w-full">
                <span className="inline-block font-bold text-base uppercase">{score.name}</span>
                <span className="font-bold text-base">{score.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div
      className={classNames('', {
        dark: nightMode
      })}>
      <div
        className={classNames(
          'w-full h-full flex justify-center dark:text-white dark:bg-slate-900',
          {}
        )}>
        {/* for confetti */}
        <canvas
          id="my-canvas"
          className={classNames('absolute pointer-events-none', {
            hidden: feedback !== GAME_WON
          })}></canvas>
        <Modal closeModal={() => setModal(null)} modal={modal} onMount={getScores}>
          {modalContent}
        </Modal>
        {feedback === GAME_WON && <Snackbar label={snackbarText} />}
        <div className="game">
          <div className="flex justify-between items-center px-2">
            <h1 className="header text-2xl font-bold dark:text-sky-400">Wriddle 🎉</h1>
            <div className="flex space-x-4 items-center">
              <div
                className={classNames(
                  'relative h-4 w-8 flex items-center rounded-lg cursor-pointer',
                  {
                    'bg-sky-200': nightMode,
                    'bg-gray-200': !nightMode
                  }
                )}
                onClick={() => setNightMode(!nightMode)}>
                <div
                  className={classNames(
                    '-left-2 absolute h-5 w-5 flex items-center justify-center rounded-full transition',
                    {
                      'transform translate-x-6': nightMode,
                      'bg-sky-400': nightMode,
                      'bg-gray-400': !nightMode
                    }
                  )}>
                  {nightMode ? (
                    <MoonIcon className="h-4 w-4" />
                  ) : (
                    <SunIcon className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              {/* <ChartBarIcon
                className="h-7 w-7 cursor-pointer"
                onClick={() => setModal('high-scores')}
              /> */}
              <QuestionMarkCircleIcon
                className="h-7 w-7 cursor-pointer"
                onClick={() => setModal('instructions')}
              />
            </div>
          </div>
          <div className="px-2">
            <span>
              Win Streak: <strong> {streak}</strong>
              {Array(streak).fill(<span>🔥</span>)}
            </span>
          </div>
          <div className="words text-2xl">{getWords()}</div>
          <div
            className={classNames('px-2 feedback', {
              'text-black dark:text-white': feedback === GAME_WON,
              'text-red-600': feedback !== GAME_WON
            })}>
            <div style={{ fontWeight: feedback === GAME_WON ? '700' : '400' }}>{feedback}</div>
            {feedback === GAME_WON && (
              <div className="quote italic text-xs">
                <div className="">
                  {`"`}
                  {quote.text}
                  {`"`}
                </div>
                <div>- {quote.author || 'unknown'}</div>
              </div>
            )}
          </div>
          {feedback === GAME_LOST && (
            <div className="text-red-600">{`The word was '${answer}'.`}</div>
          )}
          {![GAME_WON, GAME_LOST].includes(feedback) && (
            <form onSubmit={onSubmit}>
              <input
                className="hidden border border-black rounded focus:outline-none dark:bg-transparent dark:border-white"
                value={current.toUpperCase()}
                onChange={(e) => setCurrent(e.target.value.toLowerCase())}
                placeholder="Guess a 5 letter word..."
                type="text"
              />
            </form>
          )}

          <div className="px-2 game-buttons space-y-2">
            {![GAME_WON, GAME_LOST].includes(feedback) && (
              <button
                className="bg-teal-400 m-0 dark:bg-sky-400 dark:text-white"
                onClick={onSubmit}>
                Submit Word
              </button>
            )}
            <button onClick={newGame} className="bg-teal-400 m-0 dark:bg-sky-400 dark:text-white">
              New Game
            </button>
          </div>

          {getKeyboard()}

          {/* <div>
            <span>Your Name: </span>
            <input
              className="border border-gray-200 w-full p-2 rounded-lg m-0 dark:text-black"
              value={chosenName}
              onChange={(e) => setChosenName(e.target.value)}
              placeholder="Enter your name here..."
            />
            <span className="text-xs text-gray-400">
              As long as your name is present, your high score will update whenever you win
            </span>
          </div> */}

          <div className="flex space-x-2">
            <a
              className="social-link  dark:bg-white rounded-lg"
              href="https://github.com/rjk79"
              target="_blank"
              rel="noreferrer">
              <img src={require('./github.png')} />
            </a>
            <a
              className="social-link dark:bg-white rounded-lg"
              href="https://www.linkedin.com/in/robert-ku-b9464461"
              target="_blank"
              rel="noreferrer">
              <img src={require('./linkedin.png')} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
