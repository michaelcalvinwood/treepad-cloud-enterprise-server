const axios = require('axios');


exports.sendEmailVerification = (email, url, res) => {
    const emailMessage = `Someone has asked to join TreePad Cloud with this email address. If this was you, please click the folling link to verify your email address:
    <a href='${url}'>email verification</a>. Otherwise, kindly disregard this email.`

    // console.log(emailMessage);

    let request = {
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
            "subject": "Welcome to TreePad Cloud",
            "body": {
              "parts": [
                {
                  "type": "text/html",
                  "content": emailMessage
                }
              ]
            }
          }
    }

    // request = {
    //     url: 'https://api.smtp.com/v4/channels',
    //     method: 'get',
    //     headers: {
    //         'X-SMTPCOM-API': process.env.SMTP_API_KEY
    //     }
    // }
    console.log(JSON.stringify(request, null, 4));

    axios(request)
    .then(result => {
        console.log ("hello result");
        res.status(200).send(`A verification email has been sent to ${email}.`);
        return;
    })
    .catch(err => {
        // TODO: add error function that not only sends errors to customers but logs them in the error database as well
        // TODO: use this error function for all res errors.

        console.log('error', JSON.stringify(err));
        res.status(401).send(`Mail Delivery Error: Could not send verification email to ${email}.`);
        return;
    })

    return;

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
