import React, {useState, useEffect} from 'react'
import Attempt from './attempt';

import {words} from './nouns'

const GAME_LOST = 'Sorry, play again? 🥺'
const GAME_WON = 'YOU WIN! 🥳'

const CORRECT_POSITION = 'green'
const WRONG_POSITION = 'orange'
const WRONG = 'gray'

const Board = () => {
    const [answer, setAnswer] = useState('')
    const [attempts, setAttempts] = useState([])
    const [current, setCurrent] = useState('')
    const [feedback, setFeedback] = useState('')
    const [streak, setStreak] = useState(0)
    const [showInstructions, setShowInstructions] = useState(true)

    useEffect(() => {
        resetWord()
    }, [])

    const attemptItems = attempts.map((attempt, idx) => (
        <div key={idx} className="word">
            {attempt}
        </div>
    ))

    function getBlankItems() {
        const items = []
        for (let i = attempts.length; i < 6; i++) {
            items.push(
                <div key={i} className="word">
                    {Array(5).fill(<span className="character"></span>)}
                </div>
            )
        }

        return items
    }

    function newGame() {
        if (feedback === GAME_WON) {
            setStreak(streak + 1)
        } else {
            setStreak(0)
        }

        setAttempts([])
        setCurrent('')
        setFeedback('')
        resetWord()
    }

    function resetWord() {
        const index = Math.floor(Math.random() * words.length - 1)
        setAnswer(words[index].toLowerCase())
    }

    function getColor(char, index) {
        return answer[index] === char
            ? CORRECT_POSITION
            : answer.includes(char)
            ? WRONG_POSITION
            : WRONG
    }

    async function onSubmit(e) {
        e.preventDefault()

        if ([GAME_LOST, GAME_WON].includes(feedback)) {
            return
        }

        await checkWord().then(res => {
            if (res.status === 404) {
                setFeedback(`Sorry, ${current} is not a word`)
            } else {
                if (current.length === 5) {
                    const coloredCurrent = current.split('').map((char, index) =>
                        <span key={index}
                            style={{ color: getColor(char, index)}}
                            className="character"
                        >
                            {char}
                        </span>
                    )
                    const newAttempts = [...attempts, coloredCurrent]

                    setAttempts(newAttempts)
                    setCurrent('')
                    setFeedback('')
                    if (current === answer) {
                        setFeedback(GAME_WON)
                    } else if (newAttempts.length === 6) {
                        setFeedback(GAME_LOST)
                    }
                } else {
                    setFeedback('Attempt must be 5 letters')
                }
            }
        })
    }

    async function checkWord() {
        if (words.map(word => word.toLowerCase()).includes(current)) return Promise.resolve({
            status: 200
        })

        const request = new Request(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${current}`,
            {
                method: 'GET',
            }
        );

        return fetch(request)
    }

    function getKeyboard() {
       const keyboardRows = [
           'qwertyuiop'.split(''),
           'asdfghjkl'.split(''),
           'zxcvbnm'.split(''),
       ]

       return <div className="keyboard">
           {keyboardRows.map((row, index) =>
                <div>
                    {index === keyboardRows.length - 1 &&
                    <button
                        className="keyboard-command"
                        onClick={() => setCurrent(current.slice(0, current.length - 1))}
                    >
                    DEL
                    </button>}
                    {getKeyboardRow(row)}
                    {index === keyboardRows.length - 1 &&
                    <button className="keyboard-command" onClick={onSubmit}>
                        ENTER
                    </button>}
                </div>
            )}
       </div>
    }

    function getKeyboardRow(row) {
        const guessedLetters = attempts.map(attempt => (
            attempt.map(charItem => charItem.props.children).join('')
        )).join('')

        return row.map(char =>
        <button
            className="keyboard-character"
            style={{
                backgroundColor: guessedLetters.includes(char) ? 'lightgrey' : 'white'
            }}
            onClick={() => setCurrent(current + char)}
        >
            {char}
        </button>)
    }

    return (
        <div className="game">
            <h1 className="header">Wriddle 🎉</h1>
            <div>
                Win Streak: <strong>{streak}</strong>
                {Array(streak).fill(<span>🔥</span>)}
            </div>
            <div className="words">
                {attemptItems}
                {getBlankItems()}
            </div>
            <form onSubmit={onSubmit}>
                <input
                    value={current.toUpperCase()}
                    onChange={e => setCurrent(e.target.value.toLowerCase())}
                    placeholder="Guess a 5 letter word..."
                    type="text"
                />
            </form>
            <button onClick={onSubmit}>Submit Word</button>
            <div>
                <button onClick={newGame}>New Game</button>
            </div>
            <div className="feedback" style={{
                color: feedback === GAME_WON ? 'black' : 'red',
            }}>{feedback}</div>
            <div style={{color: 'red'}}>
                {feedback === GAME_LOST && `The word was '${answer}'.`}
            </div>

            {getKeyboard()}

            <button onClick={() => setShowInstructions(!showInstructions)}>Show/Hide Instructions</button>
            {showInstructions && <div className="instructions">
                <h2>Instructions:</h2>
                <div>
                    Try to guess the word! It's like Mastermind and you have 6 guesses. After you guess:
                    <ul>
                        <li>If a letter is not in the word, it will appear <span style={{color: WRONG}}>{WRONG}</span></li>
                        <li>If a letter is in the word but is not in the right spot, it will appear <span style={{color: WRONG_POSITION}}>{WRONG_POSITION}</span></li>
                        <li>If a letter is in the word and in the right spot, it will appear <span style={{color: CORRECT_POSITION}}>{CORRECT_POSITION}</span></li>
                    </ul>
                </div>
            </div>}
            <a className="github-link" href="https://github.com/rjk79" target="_blank">
                {'My Github >>>'}
            </a>
        </div>
    )
}

export default Board;