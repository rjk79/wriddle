import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChartBarIcon, QuestionMarkCircleIcon } from '@heroicons/react/solid';

import Modal from './Modal';
import { nouns } from './nouns';
import { adjectives } from './adjectives';
import { verbs } from './verbs';

const words = [...nouns, ...adjectives, ...verbs];

const GAME_LOST = 'Sorry, play again? 🥺';
const GAME_WON = 'YOU WIN! 🥳';

const CORRECT_POSITION = 'green';
const WRONG_POSITION = 'darkorange';
const WRONG = 'black';
const KEYBOARD_UNGUESSED_COLOR = 'grey';

const keyboardRows = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];

const Board = () => {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [current, setCurrent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [quote, setQuote] = useState({});
  const [chosenName, setChosenName] = useState('');
  const [scores, setScores] = useState([]);
  const [modal, setModal] = useState(null);

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
      // window.confetti({
      //   particleCount: 150
      // });
    } else if (feedback === GAME_LOST) {
      setStreak(0);
      saveStreak(0);
    }
  }, [feedback]);

  async function getScores() {
    const res = await axios.get('/api/scores');
    setScores(res.data);
  }

  async function saveScore(streak) {
    const existingScore = scores.find(
      (score) => score.name.toLowerCase() === chosenName.toLowerCase()
    );
    if (chosenName && existingScore && existingScore.value < streak) {
      axios
        .patch(`/api/scores/${existingScore._id}`, {
          value: String(streak)
        })
        .then((res) => getScores());
    } else {
      axios
        .post('/api/scores', {
          name: chosenName,
          value: String(streak)
        })
        .then((res) => getScores());
    }
  }

  function getWords() {
    const items = [];
    for (let i = 0; i < 6; i++) {
      const newItem =
        i < attempts.length ? (
          <div key={i} className="word revealed">
            {attempts[i]}
          </div>
        ) : i === attempts.length ? (
          <div key={i} className="word">
            {getCurrent()}
          </div>
        ) : (
          <div key={i} className="word">
            {Array(5).fill(<span className="character"></span>)}
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
          <span className="character" key={i}>
            {current[i]}
          </span>
        );
      } else {
        items.push(<span className="character" key={i}></span>);
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

    saveScore(streak);
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

    setLoading(true);
    const res = await checkWord();
    setLoading(false);
    if (res.status === 404) {
      setFeedback(`Sorry, ${current} is not a word`);
    } else if (res.status === 200) {
      if (current.length === 5) {
        const coloredCurrent = current.split('').map((char, index) => (
          <span
            key={index}
            style={{
              backgroundColor: getColor(char, index),
              color: 'white'
            }}
            className="character">
            {char}
          </span>
        ));
        const newAttempts = [...attempts, coloredCurrent];

        setAttempts(newAttempts);
        setCurrent('');
        setFeedback('');
        if (current === answer) {
          setFeedback(GAME_WON);
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
      const attemptLetters = attempt.map((el) => el.props.children);

      attemptLetters.forEach((char, index) => {
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
          {scores.map((score, index) => (
            <div key={index} className="py-2 flex">
              <div>
                {index + 1}
                {`.`}
                {index === 0 && <>🥇</>}
                {index === 1 && <>🥈</>}
                {index === 2 && <>🥉</>}
              </div>
              <span className="ml-2 flex">
                <span className="inline-block font-bold text-base uppercase w-40 truncate">
                  {score.name}
                </span>
                <span className="font-bold text-base">{score.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="w-full h-full flex justify-center">
      <Modal closeModal={() => setModal(null)} modal={modal}>
        {modalContent}
      </Modal>
      <div className="game">
        <div className="flex justify-between items-center">
          <h1 className="header text-2xl font-bold">Wriddle 🎉</h1>
          <div className="flex space-x-2">
            <ChartBarIcon
              className="h-7 w-7 cursor-pointer"
              onClick={() => setModal('high-scores')}
            />
            <QuestionMarkCircleIcon
              className="h-7 w-7 cursor-pointer"
              onClick={() => setModal('instructions')}
            />
          </div>
        </div>
        <div>
          <span>
            Win Streak: <strong> {streak}</strong>
            {Array(streak).fill(<span>🔥</span>)}
          </span>
        </div>
        <div className="words text-2xl">{getWords()}</div>
        <div
          className="feedback"
          style={{
            color: feedback === GAME_WON ? 'black' : 'red'
          }}>
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
          <div style={{ color: 'red' }}>{`The word was '${answer}'.`}</div>
        )}
        {![GAME_WON, GAME_LOST].includes(feedback) && (
          <form onSubmit={onSubmit}>
            <input
              className="border border-black rounded focus:outline-none"
              value={current.toUpperCase()}
              onChange={(e) => setCurrent(e.target.value.toLowerCase())}
              placeholder="Guess a 5 letter word..."
              type="text"
            />
          </form>
        )}

        <div className="game-buttons">
          {![GAME_WON, GAME_LOST].includes(feedback) && (
            <button className="bg-teal-400" onClick={onSubmit}>
              Submit Word
            </button>
          )}
          <button onClick={newGame} className="bg-teal-400">
            New Game
          </button>
        </div>

        {getKeyboard()}

        <div>
          <span>Your Name: </span>
          <input
            className="border border-gray-200 w-full p-2 rounded-lg m-0"
            value={chosenName}
            onChange={(e) => setChosenName(e.target.value)}
            placeholder="Enter your name here..."
          />
          <span className="text-xs text-gray-400">
            Enter your name to update your score whenever you win
          </span>
        </div>

        <div className="flex">
          <a
            className="social-link"
            href="https://github.com/rjk79"
            target="_blank"
            rel="noreferrer">
            <img src="github.png" />
          </a>
          <a
            className="social-link"
            href="https://www.linkedin.com/in/robert-ku-b9464461"
            target="_blank"
            rel="noreferrer">
            <img src="linkedin.png" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Board;
