const express = require("express")
const app = express()
const exphbs = require('express-handlebars');
const HTTP_PORT = process.env.PORT || 3000
const mongoose = require("mongoose")

const CONNECTION_STRING = "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority"
mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => { console.log("Mongo DB connected successfully.");});
app.get("/", (req, res) => {
    return res.send("Hello World")
})

app.listen(HTTP_PORT, () => {
    console.log("Server is running on port 3000")
})