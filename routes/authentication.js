const router = require('express').Router();
const db = require('../database/database-interface');

// parent route: /authentication

router.route('/login')
    .get((req, res) => {
        res.status(200).send('hello world');
    })

router.route('/verify')
    .get(db.verifyUser);

router.route('/register')
    .post(db.registerUser);


module.exports = router;