import React, {useState, useEffect} from 'react'
import Attempt from './attempt';

import {nouns} from './nouns'
import {adjectives} from './adjectives'
import {verbs} from './verbs'

const words = [
    ...nouns,
    ...adjectives,
    ...verbs,
]

const GAME_LOST = 'Sorry, play again? 🥺'
const GAME_WON = 'YOU WIN! 🥳'

const CORRECT_POSITION = 'green'
const WRONG_POSITION = 'darkorange'
const WRONG = 'gray'
const KEYBOARD_WRONG_COLOR = 'black'
const KEYBOARD_UNGUESSED_COLOR = 'grey'

const keyboardRows = [
    'qwertyuiop'.split(''),
    'asdfghjkl'.split(''),
    'zxcvbnm'.split(''),
]

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

    useEffect(() => {
        if (feedback === GAME_WON) {
            setStreak(streak + 1)
        } else if (feedback === GAME_LOST) {
            setStreak(0)
        }
    }, [feedback])

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
        const letterColorMap = getLetterColorMap()

        return row.map(char =>
        <button
            className="keyboard-character"
            style={{
                color: letterColorMap[char] === KEYBOARD_UNGUESSED_COLOR
                    ? 'black'
                    : 'white',
                backgroundColor: letterColorMap[char] !== KEYBOARD_UNGUESSED_COLOR ? letterColorMap[char] : 'white',
            }}
            onClick={() => setCurrent(current + char)}
        >
            {char}
        </button>)
    }

    function getLetterColorMap() {
        const allLetters = keyboardRows.reduce((acc, curr) => (
            [...acc, ...curr]
        ), [])

        const letterColorMap = {}

        const LETTER_RANKING = [
            KEYBOARD_UNGUESSED_COLOR,
            KEYBOARD_WRONG_COLOR,
            WRONG_POSITION,
            CORRECT_POSITION,
        ]

        allLetters.forEach(char => letterColorMap[char] = KEYBOARD_UNGUESSED_COLOR)

        attempts.forEach(attempt => {
            const attemptLetters = attempt.map(el => el.props.children)

            attemptLetters.forEach((char, index) => {
                let color = getColor(char, index);
                if (color === WRONG) color = KEYBOARD_WRONG_COLOR
                const currentColor = letterColorMap[char];

                if (LETTER_RANKING.indexOf(color) > LETTER_RANKING.indexOf(currentColor)) {
                    letterColorMap[char] = color
                }
            })
        })

        return letterColorMap;
    }

    return (
        <div className="game">
            <h1 className="header">Wriddle 🎉</h1>
            <div>
                <span>
                    Win Streak: <strong>{streak}</strong>
                    {Array(streak).fill(<span>🔥</span>)}
                </span>
            </div>
            <div className="words">
                {attemptItems}
                {getBlankItems()}
            </div>
            <div className="feedback" style={{
                color: feedback === GAME_WON ? 'black' : 'red',
                fontWeight: feedback === GAME_WON ? '700' : '400',
            }}>
                {feedback}
            </div>
            {feedback === GAME_LOST && <div style={{ color: 'red' }}>
                {`The word was '${answer}'.`}
            </div>}
            <form onSubmit={onSubmit}>
                <input
                    value={current.toUpperCase()}
                    onChange={e => setCurrent(e.target.value.toLowerCase())}
                    placeholder="Guess a 5 letter word..."
                    type="text"
                />
            </form>
            <div className="game-buttons">
                <button onClick={onSubmit}>Submit Word</button>
                {[GAME_WON, GAME_LOST].includes(feedback) && <button onClick={newGame}>New Game</button>}
            </div>

            {getKeyboard()}

            {
                showInstructions ? (
                    <div className="instructions">
                        <h2>Instructions:</h2>
                        <div className="hide" onClick={() => setShowInstructions(false)}>X</div>
                        <div>
                            Try to guess the word! It's like Mastermind and you have 6 guesses. After you guess:
                            <ul>
                                <li>If a letter is not in the word, it will appear <strong style={{color: WRONG}}>{WRONG}</strong></li>
                                <li>If a letter is in the word but is not in the right spot, it will appear <strong style={{ color: WRONG_POSITION }}>orange</strong></li>
                                <li>If a letter is in the word and in the right spot, it will appear <strong style={{color: CORRECT_POSITION}}>{CORRECT_POSITION}</strong></li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowInstructions(true)}>Show Instructions</button>
                )
            }
            <a className="social-link" href="https://github.com/rjk79" target="_blank">
                <img src="github.png"/>
            </a>
            <a className="social-link" href="https://www.linkedin.com/in/robert-ku-b9464461" target="_blank">
                <img src="linkedin.png"/>
            </a>
        </div>
    )
}

export default Board;