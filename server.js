const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require('path');
const app = express();

// Middleware
// Important: Order matters! Put static file serving after our root route handler
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// MySQL connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "JULO2802",
    database: "nodejs"
});

connection.connect(function(error) {
    if (error) {
        console.error("Error connecting to database:", error);
        throw error;
    }
    console.log("Connection to database successful");
});

// Routes
// Important: Place the root route before static file serving
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, 'minimain.html'));
});

// Static file serving comes after the root route
app.use(express.static(path.join(__dirname)));

app.get("/index", function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post("/login", function(req, res) {
    const { username, password } = req.body;

    connection.query(
        "SELECT * FROM userlogin WHERE user_name = ?",
        [username],
        function(error, results) {
            if (error) {
                console.error("Login error:", error);
                return res.status(500).send("Database query error");
            }

            if (results.length > 0) {
                if (results[0].user_pass === password) {
                    req.session.userId = results[0].id;
                    req.session.username = results[0].user_name;
                    res.redirect("/");
                } else {
                    res.redirect("/index?error=invalid");
                }
            } else {
                res.redirect("/index?error=invalid");
            }
        }
    );
});

app.get("/signup", function(req, res) {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post("/signup", function(req, res) {
    const { username, password } = req.body;

    connection.query(
        "INSERT INTO userlogin (user_name, user_pass) VALUES (?, ?)",
        [username, password],
        function(error, results) {
            if (error) {
                console.error("Signup error:", error);
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.redirect("/signup?error=duplicate");
                }
                return res.status(500).send("Error registering user");
            }
            res.redirect("/index?success=registered");
        }
    );
});

// Protected routes
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/index');
    }
};

app.get("/career.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'career.html'));
});

app.get("/company.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'company.html'));
});

app.get("/std.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'std.html'));
});

app.get("/degree.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'degree.html'));
});

app.get("/appt_test.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'appt_test.html'));
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
});