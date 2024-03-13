//jshint esversion:6

// Disini tempat mengaktifkan module
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

// mengaktifkan aplikasi express()
const app = express();
const port = process.env.PORT || 3000;

// Disini tempat set dan use
// memasang view engine ejs
app.set("view engine", "ejs");
// membuat folder public menjadi path yang statis
app.use(express.static("public"));
// mempermudah pengolahan data dari request form html
app.use(bodyParser.urlencoded({extended: true}));
// mempersiapkan express session. Melakukakn inisialisasi session.
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
// menggunakan passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Disini tempat mongoose
// menghubungkan mongoDB dengan mongoose
mongoose.connect("mongodb://127.0.0.1:27017/userDB");
// membuat schema user
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String
});

// Mongoose plugin disini
// mongoose encryption plugin
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
// memasang plugin passport-local mongoose kedalam userSchema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Disini mongoose Model
// membuat model dengan kompilasi dari schema user
const User = mongoose.model('User', userSchema);

// menggunakan metode autentikasi statis model di-LocalStrategy
passport.use(User.createStrategy());

// Disini tempat serialisasi
// menggunakan serialisasi statis dan de-serialisasi model untuk dukungan passport-session
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// serialisasi dan de-serialisasi dari passport-google-oauth20
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// setup google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// Disini tempat HTTP Request
// GET
// autentikasi request untuk login menggunakan google akun
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));
// autentikasi ketika google akun menerima dan redirect ke page "secrets"
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/", (req,res)=>{
  res.render("home");
});

app.get("/register", (req,res)=>{
  res.render("register");
});

app.get("/login", (req,res)=>{
  res.render("login");
});

app.get("/logout", (req,res, next)=>{
  req.logout(function(err) {
    if (err) { return console.log(err); }
    res.redirect('/');
  });
});

app.get("/secrets", (req,res)=>{
  console.log(req.isAuthenticated());
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

// POST
app.post("/register", (req,res, next)=>{
  User.register({username: req.body.username}, req.body.password, (err, user)=>{
    if(err){
      console.log(err);
      return next(res.redirect("/register"));
    }else{
      req.login(user, (err)=> {
        if (err) { 
          return next(err); 
        }
        return res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", (req, res, next)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err)=> {
    if (err) { 
      return next(err); 
    }
    return res.redirect("/secrets");
  });
 
});

// menghubungkan port
app.listen(port, ()=>{
  console.log("working on port "+ port);
});