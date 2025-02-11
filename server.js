const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const MongoStore = require('connect-mongo');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');


mongoose.connect("mongodb+srv://leonardokhirano:leo@cluster0.m6w8m.mongodb.net/appdata_db", {}).then();

const db = mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
});


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const shapeSchema = new mongoose.Schema({
    userName: String,
    shapeName: String,
    shape: String,
    description: String,
    selfTitled: Boolean,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
const Shape = mongoose.model("Shape", shapeSchema);
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'q8934ujtsodff9aew',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: "mongodb://localhost:27017/appdata_db",
        collectionName: "sessions",
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: false
    }}));

const strategy = new LocalStrategy(User.authenticate())
passport.use(strategy);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());




app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user);
        res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
        res.redirect('/login');

    }
});
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));

app.get('/current-user', (req, res) => {
    if (req.user) {
        res.json({
            username: req.user.username,
        });
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
});


app.post('/register', function (req, res) {
    User.register(
      new User({
          username: req.body.username
      }), req.body.password, function (err) {
          if (err) {
              res.send(err);
          } else {
              res.send({ message: "Successful" });
          }
      }
    )
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/'
}), (err, req, res, next) => {

    if (err) next(err);
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login");
    });
});

app.get("/allshapes", async (req, res) => {
    try {
        const data = await Shape.find({});
        res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching shapes:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/shapes", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log("Authenticated User:", req.user);

        const data = await Shape.find({ userName: req.user.username });
        res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching shapes:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/submit", async (req, res) => {
    try {
        const { userName, shapeName, shape, description } = req.body;
        console.log(req.body);
        const selfTitled = userName.toLowerCase() === shapeName.toLowerCase();

        const newShape = new Shape({ userName, shapeName, shape, description, selfTitled });
        await newShape.save();

        res.status(200).send("Shape submitted successfully!");
    } catch (err) {
        console.error("Error submitting shape:", err);
        res.status(400).send("Error submitting shape");
    }
});
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
