const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let jwt = require('jsonwebtoken');
const secret = 'hosmisFomtesting'
const md5 = require('md5');




app.use(cors())

// create the connection to database
const connection = mysql.createConnection({
    host: '172.168.0.19',
    user: 'hosadmin',
    password:'Foundry10704',
    database: 'nbhosp'
  });

// post request
app.post('/register',jsonParser, function (req, res, next) {
 // Store hash in your password DB.
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        connection.execute(
            'INSERT INTO users(email,password,fname,lname) VALUES(?,?,?,?)',
            [req.body.email, hash, req.body.fname, req.body.lname],
            function(err, results, fields) {
             if(err) {
                res.json({status:'error',message:err})
                return
             }
              res.json({status: 'ok'})
          
              // If you execute same statement again, it will be picked from a LRU cache
              // which will save query preparation time and give better performance
            }
          );
        
        })
       
    });
   

    app.post('/login', jsonParser, function (req, res, next) {
      connection.execute(
        'SELECT * FROM opduser WHERE loginname=?',
        [req.body.loginname],
        function (err, users, fields) {
          if (err) {
            res.status(500).json({ status: 'error', message: err });
            return;
          }
          if (users.length == 0) {
            res.status(404).json({ status: 'error', message: 'no user found' });
            return;
          }
    
          const hashedUserEnteredPassword = md5(req.body.passweb).toUpperCase();
          console.log('req.body.passweb:', hashedUserEnteredPassword);
          console.log('req.body.loginname:', req.body.loginname);
          if (hashedUserEnteredPassword === users[0].passweb) {
            // ทำการเปรียบเทียบรหัสผ่านที่เข้ารหัสแล้วกับรหัสผ่านในฐานข้อมูลที่เข้ารหัสแล้วด้วย MD5
            const expiresIn = 6000; // 60 วินาที (60s)
            const exp = Math.floor(Date.now() / 1000) + expiresIn;
            let token = jwt.sign({ loginname: users[0].loginname, exp }, secret); // ใส่ exp ไปใน payload ของ JWT
            res.json({ status: 'ok', message: 'Login success', token, expiresIn: expiresIn});
          } else {
            res.json({ status: 'error', message: 'Login failed' });
          }
        }
      );
    });
    
    
    
    
      
//ใส authen tokens

app.post('/authen', jsonParser, function (req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    var decoded = jwt.verify(token, secret);

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp <= currentTime) {
      res.status(403).json({ status: 'forbidden', message: 'Access Token Invalid' });
      return;
    }

    // Fetch user data from the database based on decoded.loginname
    connection.execute(
      'SELECT loginname, name, entryposition, groupname FROM opduser WHERE loginname = ?',
      [decoded.loginname],
      function (err, users, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: err });
          return;
        }

        if (users.length === 0) {
          res.status(404).json({ status: 'error', message: 'User not found' });
          return;
        }

        // Combine user data with decoded data and send the response
        const user = {
          loginname: decoded.loginname,
          name: users[0].name,
          entryposition: users[0].entryposition,
          groupname: users[0].groupname
        };

        res.json({ status: 'ok', user });
      }
    );
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});



  app.get('/test', function (req, res) {
    connection.execute(
      'SELECT * FROM opduser',
      function (err, users, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: err });
          return;
        }
        if (users.length == 0) {
          res.status(404).json({ status: 'error', message: 'no user found' });
          return;
        }
        res.json({ status: 'ok', data: users });
      }
    );
  });

  // API endpoint to fetch data for a specific user based on loginname เรียกดูและค้นหาเป็นรายคน
app.get('/sse', function (req, res) {
    const loginname = req.query.loginname;
  
    if (!loginname) {
      res.status(400).json({ status: 'error', message: 'loginname parameter is missing' });
      return;
    }
  
    connection.execute(
      'SELECT loginname,name,passweb FROM opduser WHERE loginname = ?',
      [loginname],
      function (err, users, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: err });
          return;
        }
        if (users.length == 0) {
          res.status(404).json({ status: 'error', message: 'user not found' });
          return;
        }
        res.json({ status: 'ok', data: users[0] });
      }
    );
  });


  // API endpoint to fetch data for a specific user based on loginname and compare the passwords
app.post('/compare', jsonParser, function (req, res) {
    const loginname = req.body.loginname;
    const passweb = req.body.passweb;
  
    if (!loginname || !passweb) {
      res.status(400).json({ status: 'error', message: 'Missing loginname or passweb' });
      return;
    }
  //เช็กว่า user หรือ password ผิด
    connection.execute(
      'SELECT * FROM opduser WHERE loginname = ?',
      [loginname],
      function (err, users, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: err });
          return;
        }
  
        if (users.length === 0) {
          res.status(404).json({ status: 'error', message: 'User not found' });
          return;
        }
  
        const hashedUserEnteredPassword = passweb;
        if (hashedUserEnteredPassword === users[0].passweb) {
          res.json({ status: 'ok', message: 'Passwords match' });
        } else {
          if (loginname !== users[0].loginname) {
            res.json({ status: 'error', message: 'loginname not match' });
          } else {
            res.json({ status: 'error', message: 'passweb not match' });
          }
        }
      }
    );
  });
  


  app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333');
  });