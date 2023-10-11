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
  featured: Boolean,
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
  imgFilename: String,
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
  let received = [];
  let readyForDelivery = [];
  let inTransit = [];

  try {
    const response = await fetch(
      `http://localhost:${HTTP_PORT}/customers/desc/`,
      {
        method: "GET",
        headers: { "Content-type": "application/json" },
      }
    );
    if (response.ok === false) {
      throw Error(`${response.status} - cannot connect to API`);
    }
    const responseJSON = await response.json();

    received = responseJSON.received;
    readyForDelivery = responseJSON.readyForDelivery;
    inTransit = responseJSON.inTransit;
  } catch (err) {
    console.log(err);
  }

  return res.render("index", {
    layout: "header-footer",
    page: "Home",
    received: received,
    readyForDelivery: readyForDelivery,
    inTransit: inTransit,
  });
});

app.get("/history", async (req, res) => {
  let delivered = [];

  try {
    const response = await fetch(
      `http://localhost:${HTTP_PORT}/customers/desc/`,
      {
        method: "GET",
        headers: { "Content-type": "application/json" },
      }
    );
    if (response.ok === false) {
      throw Error(`${response.status} - cannot connect to API`);
    }
    const responseJSON = await response.json();

    delivered = responseJSON.delivered;
  } catch (err) {
    console.log(err);
  }

  return res.render("history", {
    layout: "header-footer",
    page: "History",
    delivered: delivered,
  });
});

// #region SEARCH CUSTOMER
const ASC = 1;
const DESC = -1;

app.get("/customers/:type", async (req, res) => {
  let response = {
    received: [],
    readyForDelivery: [],
    inTransit: [],
    delivered: [],
  };
  let sort = ASC;

  if (req.params.type === "desc") {
    sort = DESC;
  }

  try {
    const details = await Order.find().sort({ timestamp: sort }).lean().exec();

    for (currOrder of details) {
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
        case RECEIVED:
          response.received.push(currOrder);
          break;
        case IN_TRANSIT:
          response.inTransit.push(currOrder);
          break;
        case READY_FOR_DELIVERY:
          response.readyForDelivery.push(currOrder);
          break;
        default:
          response.delivered.push(currOrder);
          break;
      }
    }
  } catch (err) {
    console.log(err);
  }

  return res.json(response);
});

app.get("/customers/:type/:name", async (req, res) => {
  const pattern = "(?i)" + req.params.name + "(?-i)";
  let sort = ASC;
  let response = {
    received: [],
    readyForDelivery: [],
    inTransit: [],
    delivered: [],
  };

  if (req.params.type === "desc") {
    sort = DESC;
  }

  try {
    const details = await Order.find({
      customer: { $regex: pattern },
    })
      .sort({ timestamp: sort })
      .lean()
      .exec();

    for (currOrder of details) {
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

      currOrder.items = items;

      switch (currOrder.status) {
        case RECEIVED:
          response.received.push(currOrder);
          break;
        case IN_TRANSIT:
          response.inTransit.push(currOrder);
          break;
        case READY_FOR_DELIVERY:
          response.readyForDelivery.push(currOrder);
          break;
        default:
          response.delivered.push(currOrder);
          break;
      }
    }
  } catch (err) {
    console.log(err);
  }

  return res.json(response);
});
// #endregion SEARCH CUSTOMER

// #region MANAGE ORDERS
app.get("/orders/:id", async (req, res) => {
  const statusButtonReference = [0, 0, 0, 1];
  let items = [];
  let total = 0;

  try {
    const details = await Order.findOne({ _id: req.params.id }).lean().exec();
    switch (details.status) {
      case RECEIVED:
        details.status = "RECEIVED";
        statusButtonReference[1] = 1;
        break;
      case READY_FOR_DELIVERY:
        details.status = "READY FOR DELIVERY";
        statusButtonReference[0] = 1;
        break;
      case IN_TRANSIT:
        details.status = "IN TRANSIT";
        statusButtonReference[1] = 1;
        break;
      default:
        details.status = "DELIVERED";
        statusButtonReference[3] = 0;
        break;
    }

    for (currItem of details.items) {
      const itemDetails = await Item.findOne({ _id: currItem.item })
        .lean()
        .exec();
      items.push({
        item: itemDetails,
        quantity: currItem.quantity.toString().padStart(2, "0"),
        total: (currItem.quantity * itemDetails.price).toFixed(2),
      });
      total += currItem.quantity * itemDetails.price;
    }

    let returns = {
      layout: "header-footer",
      page: "Order",
      details: details,
      items: items,
      total: total.toFixed(2),
      statusButtonReference: statusButtonReference,
    };

    if (details.driver !== "") {
      const driver = await Driver.findOne({ _id: details.driver })
        .lean()
        .exec();

      if (details.imgFilename) {
        returns.proofOfDelivery = {
          image: details.imgFilename.data.toString("base64"),
          type: details.imgFilename.contentType,
        };
      }

      returns.driver = driver;
    }

    return res.render("order", returns);
  } catch (err) {
    console.log(err);
    return res.redirect("/");
  }
});

app.post("/orders/update-status", async (req, res) => {
  const itemId = req.body.item;
  const status = parseInt(req.body.status);
  let updates;

  try {
    const order = await Order.findOne({ _id: itemId });
    if (order === null) {
      return res.redirect("/");
    }

    switch (status) {
      case READY_FOR_DELIVERY:
        updates = { status: status, driver: "" };
        break;
      case IN_TRANSIT:
        updates = { status: status, imgFilename: "" };
        break;
      default:
        updates = { status: status };
        break;
    }

    const result = await order.updateOne(updates);

    if (status === DELIVERED) {
      return res.redirect("/history");
    }

    return res.redirect("/");
  } catch (err) {
    console.log(err);
    return res.redirect("/");
  }
});
// #endregion MANAGE ORDERS

// #region ORDER FORM
// app.get("/order-form", async (req, res) => {
//   const orders = await Item.find().lean().exec();
//   const drivers = await Driver.find().lean().exec();

//   res.render("order-form", {
//     layout: "header-footer",
//     page: "Order Form",
//     orders: orders,
//     drivers: drivers,
//   });
// });

// app.post("/add-order", async (req, res) => {
//   const request = req.body;
//   const today = new Date();

//   let cart = [];
//   for (let i = 0; i < request.item.length; i++) {
//     if (parseInt(request.quantity[i]) !== 0) {
//       cart.push({
//         item: request.item[i],
//         quantity: parseInt(request.quantity[i]),
//       });
//     }
//   }

//   if (cart.length > 0) {
//     const order = new Order({
//       customer: request.name,
//       address: request.address,
//       timestamp:
//         today.getFullYear() +
//         "-" +
//         (today.getMonth() + 1).toString().padStart(2, "0") +
//         "-" +
//         today.getDate().toString().padStart(2, "0") +
//         " " +
//         today.getHours().toString().padStart(2, "0") +
//         ":" +
//         today.getMinutes().toString().padStart(2, "0") +
//         ":" +
//         today.getSeconds().toString().padStart(2, "0"),
//       status: RECEIVED,
//       items: cart,
//       driver: request.driver,
//       imgFilename: "",
//     });

//     if (request.driver !== "") {
//       order.status = IN_TRANSIT;
//     }

//     await order.save();
//     return res.redirect("/");
//   }

//   return res.redirect("/");
// });
// #endregion ORDER FORM

// #region BIOLERPLATE 2
const onHttpStart = () => {
  console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
  console.log("Press CTRL+C to stop the server.");
};

app.listen(HTTP_PORT, onHttpStart);
// #endregion BIOLERPLATE 2
