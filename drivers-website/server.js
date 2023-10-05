const express = require("express")
const app = express()
const exphbs = require('express-handlebars');
const session = require('express-session');
app.use(session({
    secret: 'secretOfFullStackDev',
    resave: false,
    saveUninitialized: true,
}))
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
const HTTP_PORT = process.env.PORT || 3000

/******************* Database setup ********************/
const mongoose = require("mongoose")
const CONNECTION_STRING = "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority"
mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => { console.log("Mongo DB connected successfully.");});

const driverSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    vehicle: String,
    color: String,
    license: String,
})
const driverAccount = mongoose.model("drivers", driverSchema)
/******************* Database setup ********************/

/******************* Session middleware setup ********************/
const sessionQuery = (req, res, next) => {
    console.log(req.session)
    if (req.session.username) {
        return next()
    }
    return res.redirect("/login")
}
/******************* Session middleware setup ********************/

app.get("/",sessionQuery,(req, res) => {
    return res.redirect("/dashboard")
})

app.get("/login", (req, res) => {
    return res.render("login.hbs",{layout: false})
})

app.post("/login", async(req, res) => {
   try{ 
    const driverFromDB = await driverAccount.findOne({username: req.body.username})
    if(!driverFromDB){
        return res.render("login.hbs",{layout: false, error: "User does not exist"})
    }
    if(driverFromDB.password !== req.body.password){
        return res.render("login.hbs",{layout: false, error: "Password is incorrect"})
    }
    console.log(driverFromDB)
    //set session
    req.session.username = req.body.username;
    //
    return res.redirect("/dashboard")
    }
    catch(error){
        console.log(error)
    }
})

app.get("/register",(req,res)=>{
    return res.render("register.hbs",{layout: false})
})

app.post("/register",async (req,res)=>{
    try{
        const driver = await driverAccount.findOne({username: req.body.username})
        if(driver){
            return res.render("register.hbs",{layout: false, error: "Username already exists"})
        }
        const newDriver = new driverAccount({
            username: req.body.username,
            password: req.body.password,
            name: req.body.fullname,
            vehicle: req.body.model,
            color: req.body.color,
            license: req.body.license,
        })
        const result = await newDriver.save()

        // set session
        req.session.username = req.body.username;
        //
        console.log(result)
        return res.redirect("/Dashboard");
    } catch(error){
        console.log(error)
    }
})

app.get("/logout", (req, res) => {
    req.session.destroy()
    return res.redirect("/login")
})
app.get("/Dashboard",sessionQuery,(req, res) => {
    return res.render("dashboard.hbs",{layout: "main.hbs"})
})
app.listen(HTTP_PORT, () => {
    console.log("Server is running on port 3000")
})