const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const lineReader = require('linebyline');
const clientSessions = require('client-sessions');

const app = express();
const PORT = 3000;

// Set up Handlebars
const exphbsInstance = exphbs.create({
    extname: '.hbs',
    defaultLayout: false,
    helpers: {
        removeExtension: function (filename) {
            return filename.replace('.jpg', '');
        },
        eq: function (a, b) {
            return a === b;
        }
    }
});

app.engine('hbs', exphbsInstance.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
    cookieName: "session",
    secret: "random_secret_key",
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));
app.use(express.static(path.join(__dirname, 'public')));

// Load user data
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "user.json"), "utf-8"));

// Load images from imagelist.txt
const images = [];
const rl = lineReader(path.join(__dirname, 'imagelist.txt'));
rl.on('line', (line) => {
    const trimmedLine = line.trim();
    if (trimmedLine !== 'Gallery.jpg') {
        images.push(trimmedLine);
    }
});

// Show Login Page
app.get('/', (req, res) => {
    res.render('login', { name: "Masoumeh Hosseinnazhad" });
});

// Handle Login Request (POST)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!users[username]) {
        return res.render("login", { name: "Masoumeh Hosseinnazhad", error: "Not a registered username" });
    }
    if (users[username] !== password) {
        return res.render("login", { name: "Masoumeh Hosseinnazhad", error: "Invalid password" });
    }

    // Store user session
    req.session.user = { name: "Masoumeh Hosseinnazhad", email: username };
    res.redirect('/gallery');
});

// Show Gallery Page
app.get('/gallery', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.render('index', {
        userName: req.session.user.name,
        userEmail: req.session.user.email,
        images,
        selectedImage: 'Gallery.jpg'
    });
});

// Handle Image Selection (POST)
app.post('/image', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const selectedImage = req.body.image || 'Gallery.jpg'; // Use req.body instead of req.query
    res.render('index', {
        userName: req.session.user.name,
        userEmail: req.session.user.email,
        images,
        selectedImage
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
