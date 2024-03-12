//jshint esversion:6
// Disini tempat mengaktifkan module
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5");

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

// Disini tempat mongoose
// menghubungkan mongoDB dengan mongoose
mongoose.connect("mongodb://127.0.0.1:27017/userDB");
// membuat schema user
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
// mongoose encryption plugin
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
// membuat model dengan kompilasi dari schema user
const User = mongoose.model('User', userSchema);

// Disini tempat HTTP Request
// GET
app.get("/", (req,res)=>{
  res.render("home");
});

app.get("/register", (req,res)=>{
  res.render("register");
});

app.get("/login", (req,res)=>{
  res.render("login");
});

app.get("/logout", (req,res)=>{
  res.redirect("/");
});

// POST
app.post("/register", (req,res)=>{
  const userName = req.body.username;
  const password = md5(req.body.password);

    const newUser = new User({
      username: userName,
      password: password
    });

    newUser.save().then(
      resolve=> {
        console.log("resolved");
        res.render("secrets");
      }, reject=> {
        res.send("Somethings error !");
        console.log(reject);
      }
    )
});

app.post("/login", (req,res)=>{
  const userName = req.body.username;
  const password = md5(req.body.password);

  User.findOne({username: userName}).then(
    resolve=> {
      if(resolve.password === password){
        res.render("secrets");
      }else{
        res.redirect("/login");
      }
    }
  )
});

// menghubungkan port
app.listen(port, ()=>{
  console.log("working on port "+ port);
});