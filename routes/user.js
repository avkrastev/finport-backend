const express = require('express');
const { check } = require('express-validator');
const { signup, login, getLoggedInUserData, updateUser } = require('../controllers/user');

const router = express.Router();

router.post('/signup', 
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 8 })
    ],
    (req, res, next) => {
        signup(req, res, next);
    }
)

router.post('/login', 
    (req, res, next) => {
        login(req, res, next);
    }
)

router.get('/', 
    (req, res, next) => {
        getLoggedInUserData(req, res, next);
    }
)

router.patch('/', 
    (req, res, next) => {
        updateUser(req, res, next);
    }
)

module.exports = router;