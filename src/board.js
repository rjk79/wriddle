import React, {useState, useEffect} from 'react'
import Attempt from './attempt';

import {words} from './nouns'

const GAME_LOST = 'Sorry, play again? 🥺'
const GAME_WON = 'YOU WIN! 🥳'

const Board = () => {
    const [answer, setAnswer] = useState('')
    const [attempts, setAttempts] = useState([])
    const [current, setCurrent] = useState('')
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        resetWord()
    }, [])

    const attemptItems = attempts.map((attempt, idx) => (
        <div key={idx}>
            {attempt}
        </div>
    ))

    function getBlankItems() {
        const items = []
        for (let i = attempts.length; i < 6; i++) {
            items.push(
                <div key={i}>_ _ _ _ _</div>
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
            ? 'green'
            : answer.includes(char)
            ? 'orange'
            : 'gray'
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
                    const coloredCurrent = current.split('').map((char, index) => <span key={index}
                        style={{ color: getColor(char, index)}}
                    >{char}</span>)
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
        const request = new Request(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${current}`,
            {
                method: 'GET',
            }
        );

        return fetch(request)
    }

    return (
        <div>
            {attemptItems}
            {getBlankItems()}
            <form onSubmit={onSubmit}>
                <input
                    value={current}
                    onChange={e => setCurrent(e.target.value.toLowerCase())}
                    placeholder="Choose a 5 letter word"
                />
                <input type="submit" value="Submit"/>
            </form>
            <button onClick={newGame}>New Game</button>
            <div className="feedback" style={{
                color: feedback === GAME_WON ? 'black' : 'red',
            }}>{feedback}</div>
            <div>
                Try to guess the word! It's like Mastermind and you have 6 guesses.
            </div>
            <a className="github-link" href="https://github.com/rjk79" target="_blank">
                *My Github*
            </a>
        </div>
    )
}

export default Board;