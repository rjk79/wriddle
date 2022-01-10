import React, {useState, useEffect} from 'react'
import Attempt from './attempt';

import {words} from './nouns'

const Board = () => {
    const [answer, setAnswer] = useState('')
    const [attempts, setAttempts] = useState([])
    const [current, setCurrent] = useState('')
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        const index = Math.floor(Math.random() * words.length - 1)
        setAnswer(words[index].toLowerCase())
    }, [])

    const attemptItems = attempts.map((attempt, idx) => (
        <div key={idx}>
            {attempt}
        </div>
    ))

    function newGame() {
        setAttempts([])
        setCurrent('')
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

        await checkWord().then(res => {
                if (res.status === 404) {
                    setFeedback(`Sorry, ${current} is not a word`)
                } else {
                    if (current.length === 5) {
                        const coloredCurrent = current.split('').map((char, index) => <span key={index}
                            style={{ color: getColor(char, index)}}
                        >{char}</span>)

                        setAttempts([...attempts, coloredCurrent])
                        setCurrent('')
                        setFeedback('')

                        if (current === answer) {
                            setFeedback('You win!')
                        } else if (attempts.length === 6) {
                            setFeedback('Sorry, play again? 🥺')
                        }
                    } else {
                        setFeedback('Attempt must be 5 letters')
                    }
                }
        })
    }

    async function checkWord() {
        // var request = new XMLHttpRequest()
        // await request.open('GET', `https://api.dictionaryapi.dev/api/v2/entries/en/${current}`, true)
        // request.onload = function () {
        //     var data = JSON.parse(this.response)
        //     console.log(data)
        //     if (request.status >= 200 && request.status < 400) {
        //         const isWord = data.title !== 'No Definitions Found'
        //         setIsValidWord(isWord)
        //     } else {
        //         console.log('error')
        //     }
        // }

        // await request.send()
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
            <form onSubmit={onSubmit}>
                <input
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    placeholder="Choose a 5 letter word"
                />
            </form>
            <button onClick={newGame}>New Game</button>
            {feedback}
        </div>
    )
}

export default Board;