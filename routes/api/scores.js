const express = require('express');
const router = express.Router();
const passport = require('passport');

const Score = require('../../models/Score');
const validateScoreInput = require('../../validation/scores');

// index
router.get('/', (req, res) => {
    Score.find()
        .sort({ value: -1 })
        .then(items => res.json(items))
        .catch(err => res.status(404).json({ notfound: 'No items found' }));
});

// show
router.get('/:id', (req, res) => {
    Score.findById(req.params.id)
        .then(item => res.json(item))
        .catch(err =>
            res.status(404).json({ notfound: 'No item found with that ID' })
        );
});

// create
router.post('/',
    (req, res) => {
        const { errors, isValid } = validateScoreInput(req.body);

        if (!isValid) {
            return res.status(400).json(errors);
        }

        const newItem = new Score({
            name: req.body.name,
            value: Number(req.body.value),
        });

        newItem.save().then(item => res.json(item));
    }
);

// edit
router.patch('/:id', (req, res) => {
    Score.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(item => res.json(item))
        .catch(err =>
            res.status(404).json({ noitemsfound: 'No items found' }
            )
        )
})


module.exports = router;