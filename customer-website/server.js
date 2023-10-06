const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// configure a folder for external css stylesheets and images
app.use(express.static("public"));

// import handlebars
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// receive data from a <form>
app.use(express.urlencoded({ extended: true }));

/// --------------
// DATABASE : Connecting to database and setting up your schemas/models (tables)
/// --------------

const mongoose = require("mongoose");

const CONNECTION_STRING =
  "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority";

mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});

// Endpoint for homepage
app.get("/", (req, res) => {
  res.render("homepage-template", {
    layout: "my-layouts",
  });
});

// Endpoint for order form page
app.get("/order-form", (req, res) => {
  res.render("order-form-page", {
    layout: "my-layouts",
  });
});

// Endpoint for order status page
app.get("/order-status", (req, res) => {
  res.render("order-status-page", {
    layout: "my-layouts",
  });
});

// ----------------
const onHttpStart = () => {
  console.log("The web server has started...");
  console.log(`Express web server running on port: ${HTTP_PORT}`);
  console.log(`Press CTRL+C to exit`);
};
app.listen(HTTP_PORT, onHttpStart);
