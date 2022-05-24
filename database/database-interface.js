const tc = require('./table-creation.js');
const mysql = require('mysql');
const server = require('../server.js');
const smtp = require('../interfaces/smtp_com');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.createTables = () => {
 
    server.dbPool.query(tc.createUserTable, (err, res, fields) => {
        if(err) console.error('Db error: ', err);
        else console.log('Created Table: users');
    });
}

const addUser = (user, email, password, res) => {
    // TODO: send add user to async process that aggregates inserts every second.

    let sql = `INSERT INTO users (user_name, email, password, status, ts) 
    VALUES('${user}', '${email}', '${bcrypt.hashSync(password, 10)}', 'pending', ${Date.now()})`;

    console.log ('secret key', process.env.SECRET_KEY)
    let token = jwt.sign({
        user: user,
        email: email
    }, process.env.SECRET_KEY, {expiresIn: '3h'});

    const url = "https://treepadcloudenterprise.com:8080/authentication/verify?info=" + token;

    server.dbPool.query(sql, (err, dbResult, fields) => {
        if(err) {
            // TODO: add monitoring of this error to resolve problems quickly
            console.log(JSON.stringify(err));

            // handle duplicate email/user name
            if (err.errno === 1062) {
               // TODO: check to see if the previous user's email/username has expired, if so, delete it and retry otherise send error
               res.status(401).send('Error: Someone with this email or user name already exists.');
                return;
            }
            res.status(401).send('Database Error: Please try again later.');
            return;
        }
        else {
            smtp.sendEmailVerification(email, url, res);
            return;
        }
    })
}

exports.registerUser = (req, res) => {
    // TODO: add captcha verification and include captcha token in body

    if (
        !req.body ||
        !req.body.user ||
        !req.body.email ||
        !req.body.password
    ) {
        return res.status(401).send("program error: missing credentials");
    }

    const {user, email, password} = req.body;

    // TODO: validate that user name and password only contain valid characters and cannot be used for SQL Injection

    // TODO: check to see if user already exists. If so, send back message

    // TODO: add password strength meter here too. If password is weak, send back message

    // TODO: add email format verification here. 

    addUser(user, email, password, res);
    
}

exports.verifyUser = (req, res) => {
    if (!req.query) return res.status(401).send('error: missing query parameters');
    if (!req.query.info) return res.status(401).send('error: missing info query parameter')    
    
    const { info } = req.query;

    if (!jwt.verify(info, process.env.SECRET_KEY)) return  res.status(403).json({ error: "Not Authorized." });
    
    const token = jwt.decode(info);
    const { user, email } = token;

    // TODO: make assignment of server dynamic for horizontal scaling

    let sql = `UPDATE users 
    SET status='active', 
    server='https://${process.env.DOMAIN}:5000' 
    WHERE email='${email}'`

    server.dbPool.query(sql, (err, dbResult, fields) => {
        if (err) {
            console.log (err);
            return res.status(401).send("Database error: Please try again later.");
            
        }
        else return res.status(200).send(`Thank you for verifying your email. You may now login to <a href='https://${process.env.DOMAIN}'>TreePad Cloud</a>`)
    });
}