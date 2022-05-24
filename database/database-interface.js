const tc = require('./table-creation.js');
const mysql = require('mysql');
const server = require('../server.js');
const axios = require('axios');

require('dotenv').config();

exports.createTables = () => {
 
    server.dbPool.query(tc.createUserTable, (err, res, fields) => {
        if(err) console.error('Db error: ', err);
        else console.log('Created Table: users');
    });
}

const emailTemplate = {
    "channel": "admin_appgalleria_com",
    "recipients": {
      "to": [
        {
          "name": "Michael Wood",
          "address": "admin@treepadcloud.com"
        }
      ]
    },
    "originator": {
      "from": {
        "name": "TreePad Cloud",
        "address": "noreply@treepadcloud.com"
      }
    },
    "custom_headers": {},
    "subject": "Testing Delivery",
    "body": {
      "parts": [
        {
          "version": "1.0",
          "type": "text/html",
          "charset": "US-ASCII",
          "encoding": "Q",
          "content": "Hello <b>Michael</b>"
        }
      ]
    }
  }

const sendEmailVerification = email => {
    const request = {
        url: 'https://api.smtp.com/v4/messages',
        method: 'post',
        headers: {
            'X-SMTPCOM-API': process.env.SMTP_API_KEY
        },
        data: {
            "channel": "admin_appgalleria_com",
            "recipients": {
              "to": [
                {
                //   "name": "Michael Wood",
                  "address": email
                }
              ]
            },
            "originator": {
              "from": {
                "name": "TreePad Cloud",
                "address": "noreply@treepadcloud.com"
              }
            },
            "subject": "Testing Delivery",
            "body": {
              "parts": [
                {
                  "type": "text/html",
                  "content": "Hello <b>Michael</b>"
                }
              ]
            }
          }
    }
    axios(request)
    .then(res => {
        console.log(res);
    })
    .catch(err => {
        console.log(JSON.stringify(err));
    })

    return;

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

    // TODO: check to see if user already exists. If so, send back message

    // TODO: add password strength meter here too. If password is weak, send back message

    // TODO: add email format verification here. 

    sendEmailVerification(req.body.email);
    res.status(200).send('hello world');
}