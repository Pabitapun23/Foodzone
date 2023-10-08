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
  const details = await Order.find().sort({ timestamp: 1 }).lean().exec();
  let received = [];
  let readyForDelivery = [];
  let inTransit = [];

  for (currOrder of details) {
    if (currOrder.status === DELIVERED) {
      continue;
    }

    let items = [];
    for (currItem of currOrder.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity.toString().padStart(2, "0"),
      });
    }

    // currOrder.timestamp = new Date(currOrder.timeStamp);
    currOrder.items = items;

    switch (currOrder.status) {
      case READY_FOR_DELIVERY:
        readyForDelivery.push(currOrder);
        break;
      case IN_TRANSIT:
        inTransit.push(currOrder);
        break;
      default:
        received.push(currOrder);
        break;
    }
  }

  return res.render("index", {
    layout: "header-footer",
    page: "Home",
    received: received,
    readyForDelivery: readyForDelivery,
    inTransit: inTransit,
  });
});

app.get("/customers", async (req, res) => {
  const details = await Order.find().sort({ timestamp: 1 }).lean().exec();
  let response = {
    received: [],
    readyForDelivery: [],
    inTransit: [],
  };

  for (currOrder of details) {
    if (currOrder.status === DELIVERED) {
      continue;
    }

    let items = [];
    for (currItem of currOrder.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity.toString().padStart(2, "0"),
      });
    }

    // currOrder.timestamp = new Date(currOrder.timeStamp);
    currOrder.items = items;

    switch (currOrder.status) {
      case READY_FOR_DELIVERY:
        response.readyForDelivery.push(currOrder);
        break;
      case IN_TRANSIT:
        response.inTransit.push(currOrder);
        break;
      default:
        response.received.push(currOrder);
        break;
    }
  }

  return res.json(response);
});

app.get("/customers/:name", async (req, res) => {
  const pattern = "(?i)" + req.params.name + "(?-i)";
  const details = await Order.find({
    customer: { $regex: pattern },
  })
    .sort({ timestamp: 1 })
    .lean()
    .exec();
  let response = {
    received: [],
    readyForDelivery: [],
    inTransit: [],
  };

  for (currOrder of details) {
    if (currOrder.status === DELIVERED) {
      continue;
    }

    let items = [];
    for (currItem of currOrder.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity.toString().padStart(2, "0"),
      });
    }

    // currOrder.timestamp = new Date(currOrder.timeStamp);
    currOrder.items = items;

    switch (currOrder.status) {
      case READY_FOR_DELIVERY:
        response.readyForDelivery.push(currOrder);
        break;
      case IN_TRANSIT:
        response.inTransit.push(currOrder);
        break;
      default:
        response.received.push(currOrder);
        break;
    }
  }

  return res.json(response);
});

app.get("/orders/:id", (req, res) => {
  return res.redirect("/");
});

app.post("/orders/update-status", async (req, res) => {
  return res.redirect("/");
});

app.get("/history", async (req, res) => {
  const details = await Order.find().sort({ timestamp: -1 }).lean().exec();
  let delivered = [];

  for (currOrder of details) {
    if (currOrder.status !== DELIVERED) {
      continue;
    }

    let items = [];
    for (currItem of currOrder.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity.toString().padStart(2, "0"),
      });
    }

    // currOrder.timestamp = new Date(currOrder.timeStamp);
    currOrder.items = items;
    delivered.push(currOrder);
  }

  return res.render("history", {
    layout: "header-footer",
    page: "History",
    delivered: delivered,
  });
});

app.get("/order", async (req, res) => {
  const orders = await Item.find().lean().exec();
  const drivers = await Driver.find().lean().exec();

  res.render("order", {
    layout: "header-footer",
    page: "Order",
    orders: orders,
    drivers: drivers,
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
        (today.getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        today.getDate().toString().padStart(2, "0") +
        " " +
        today.getHours().toString().padStart(2, "0") +
        ":" +
        today.getMinutes().toString().padStart(2, "0") +
        ":" +
        today.getSeconds().toString().padStart(2, "0"),
      status: RECEIVED,
      items: cart,
      driver: "",
    });

    await order.save();
    return res.redirect("/");
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
