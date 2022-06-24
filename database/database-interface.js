const tc = require('./table-creation.js');
const mysql = require('mysql');
const server = require('../server.js');
const smtp = require('../interfaces/smtp_com');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');
const req = require('express/lib/request');

require('dotenv').config();

const pretty = str => JSON.stringify(str, null, 4);

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

exports.loginUser = (req, res) => {
    if (
        !req.body ||
        !req.body.user ||
        !req.body.password
    ) return res.status(401).send('program error: missing credentials');

    const { user, password } = req.body;

    let sql;

    if (emailValidator.validate(user)) sql = `SELECT user_id, user_name, email, password, status, server FROM users WHERE email='${user}'`;    
    else sql = `SELECT user_id, user_name, email, password, status, server FROM users WHERE user_name='${user}'`;

    server.dbPool.query(sql, (err, dbResult, fields) => {
        if (err) {
            console.log(pretty(err));
            return res.status(401).send('Database Error. Please try again later.');
        }

        //console.log(pretty(dbResult));
        
        const status = dbResult.status;
        
        if (status === 'pending') return res.status(401).send('Please verify your email address.');
        
        const userId = dbResult[0].user_id;
        const userName = dbResult[0].user_name;
        const email = dbResult[0].email;
        const server = dbResult[0].server;

        console.log(pretty(dbResult[0].user_id), userId, userName, email, server);

        let token = jwt.sign({
            userId,
            userName,
            email,
            server
        }, process.env.SECRET_KEY);

        const response = {userId: userId, userName: userName, email: email, server: server, token: token};
        console.log('sending', pretty(response));

        //return res.status(200).send();
        return res.status(200).json(response);

    });

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