// #region BOILERPLATE 1
const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");

app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true })); // to configure express server to interpret the data sent by <form> element
// #endregion BOILERPLATE 1

// #region HANDLEBARS
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
// #endregion HANDLEBARS

// #region MONGOOSE
const mongoose = require("mongoose");
const { timeStamp } = require("console");
const CONNECTION_STRING =
  "mongodb+srv://dbUser:d06dIP5StLVihvvD@cluster0.r7i9qdi.mongodb.net/myDb?retryWrites=true&w=majority";
mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});

// schema
const Schema = mongoose.Schema;
const item = new Schema({
  name: String,
  image: String,
  description: String,
  price: Number,
});
const driver = new Schema({
  username: String,
  password: String,
  name: String,
  vehicle: String,
  color: String,
  license: String,
});
const order = new Schema({
  customer: String,
  address: String,
  timestamp: String,
  status: Number,
  items: [{ item: String, quantity: Number }],
  driver: String,
});

// model
const Order = mongoose.model("orders", order);
const Item = mongoose.model("items", item);
const Driver = mongoose.model("drivers", driver);
// #endregion MONGOOSE

const RECEIVED = 0;
const READY_FOR_DELIVERY = 1;
const IN_TRANSIT = 2;
const DELIVERED = 3;

let cart = [];

app.get("/", async (req, res) => {
  const orders = await Item.find().lean().exec();
  const drivers = await Driver.find().lean().exec();

  res.render("index", {
    layout: "header-footer",
    page: "Home",
    orders: orders,
    drivers: drivers,
  });
});

app.get("/orders", async (req, res) => {
  const details = await Order.find().lean().exec();

  let items = [];
  for (currOrder of details) {
    for (currItem of currOrder.items) {
      items.push(await Item.findOne({ _id: currItem.item }).lean().exec());
    }
  }
  console.log(items);

  res.render("order", {
    layout: "header-footer",
    page: "Orders",
    details: details,
    items: items,
  });
});

app.post("/add-order", async (req, res) => {
  const request = req.body;
  const today = new Date();

  let cart = [];
  for (let i = 0; i < request.item.length; i++) {
    if (parseInt(request.quantity[i]) !== 0) {
      cart.push({
        item: request.item[i],
        quantity: parseInt(request.quantity[i]),
      });
    }
  }

  if (cart.length > 0) {
    const order = new Order({
      customer: request.name,
      address: request.address,
      timestamp:
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate() +
        " " +
        today.getHours() +
        ":" +
        today.getMinutes() +
        ":" +
        today.getSeconds(),
      status: RECEIVED,
      items: cart,
      driver: request.driver,
    });

    await order.save();
    return res.redirect("/orders");
  }

  res.redirect("/");
});

// #region BIOLERPLATE 2
const onHttpStart = () => {
  console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
  console.log("Press CTRL+C to stop the server.");
};

app.listen(HTTP_PORT, onHttpStart);
// #endregion BIOLERPLATE 2
