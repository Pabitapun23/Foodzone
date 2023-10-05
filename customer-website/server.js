const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// configure a folder for external css stylesheets and images
app.use(express.static("assets"));

// import handlebars
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// receive data from a <form>
app.use(express.urlencoded({ extended: true }));

/// --------------
// DATABASE : Connecting to database and setting up your schemas/models (tables)
/// --------------

// TODO: Replace this connection string with yours
const mongoose = require("mongoose");

const CONNECTION_STRING =
  "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority";

mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});






// ----------------
const onHttpStart = () => {
  console.log(`Express web server running on port: ${HTTP_PORT}`);
  console.log(`Press CTRL+C to exit`);
};
app.listen(HTTP_PORT, onHttpStart);
