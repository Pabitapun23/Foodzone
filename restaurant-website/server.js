// #region BOILERPLATE 1
const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8882;
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
  "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority";
mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});
// #endregion MONGOOSE

// #region SCHEMAS & MODELS
const Schema = mongoose.Schema;
const itemSchema = new Schema({
  name: String,
  image: String,
  description: String,
  price: Number,
});

const driverSchema = new Schema({
  username: String,
  password: String,
  name: String,
  vehicle: String,
  color: String,
  license: String,
});

const orderSchema = new Schema({
  customer: String,
  address: String,
  timestamp: String,
  status: Number,
  items: [{ item: String, quantity: Number }],
  driver: String,
});

const Order = mongoose.model("orders_collection", orderSchema);
const Item = mongoose.model("items_collection", itemSchema);
const Driver = mongoose.model("drivers_collection", driverSchema);
// #endregion SCHEMAS & MODELS

const RECEIVED = 0;
const READY_FOR_DELIVERY = 1;
const IN_TRANSIT = 2;
const DELIVERED = 3;

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

  for (currOrder of details) {
    switch (currOrder.status) {
      case READY_FOR_DELIVERY:
        currOrder.status = "READY FOR DELIVERY";
        break;
      case IN_TRANSIT:
        currOrder.status = "IN TRANSIT";
        break;
      case DELIVERED:
        currOrder.status = "DELIVERED";
        break;
      default:
        currOrder.status = "RECEIVED";
    }

    let items = [];
    for (currItem of currOrder.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity,
        total: (currItem.quantity * itemDetails.price).toFixed(2),
      });
    }
    currOrder.items = items;

    if (currOrder.driver !== "") {
      currOrder.driver = await Driver.findOne({ _id: currOrder.driver })
        .lean()
        .exec();
    }
  }

  res.render("order", {
    layout: "header-footer",
    page: "Orders",
    details: details,
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
      driver: "",
    });

    await order.save();
    return res.redirect("/orders");
  }

  return res.redirect("/");
});

// #region BIOLERPLATE 2
const onHttpStart = () => {
  console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
  console.log("Press CTRL+C to stop the server.");
};

app.listen(HTTP_PORT, onHttpStart);
// #endregion BIOLERPLATE 2
