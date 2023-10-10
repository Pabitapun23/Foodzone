const { Double } = require("bson");
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
const { double } = require("webidl-conversions");

const CONNECTION_STRING =
  "mongodb+srv://fullstackdevgp4:8UtK5TqzKdnNBtLc@gp4.cdryyds.mongodb.net/project_g04?retryWrites=true&w=majority";

mongoose.connect(CONNECTION_STRING);

// check if connection was successful
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});

//setup your database models
const Schema = mongoose.Schema;
const itemSchema = new Schema({
  name: String,
  image: String,
  description: String,
  price: Number,
  featured: Boolean,
});

//items: [{ item: String, quantity: Number }],
//   items: Array,
const orderSchema = new Schema({
  customer: String,
  address: String,
  timestamp: String,
  status: Number,
  items: [{ item: String, quantity: Number }],
  driver: String,
  imgFilename: String,
});

//mongoose model object
const Item = mongoose.model("items_collection", itemSchema);
const Order = mongoose.model("orders_collections", orderSchema);

// Endpoint for homepage
app.get("/", async (req, res) => {
  try {
    //results will have all the details of menu items
    const results = await Item.find().lean().exec();
    console.log(results);

    // error handling
    if (results.length === 0) {
      return res.send("ERROR: No items found in database");
    }

    // display results in the UI using a handlebars template:
    res.render("homepage-template", {
      layout: "my-layouts",
      menuItem: results,
    });
  } catch (err) {
    console.log(err);
  }
});

// Endpoint for order form page
app.get("/add-order/:itemId?", async (req, res) => {
  try {
    //Getting items from db
    const itemFromDB = await Item.find().lean().exec();
    let items = [];
    //looping through item lists from db
    for (let item of itemFromDB) {
      // item._id.toString() - converts item's id to string
      if (item._id.toString() === req.params.itemId) {
        item.checked = true;
      }
      items.push(item);
    }
    return res.render("order-form-page", {
      layout: "my-layouts",
      menuItem: items,
    });
  } catch (err) {
    console.log(err);
    return res.render("order-form-page", {
      layout: "my-layouts",
      errMsg: "ERROR: Order cannot be placed!",
    });
  }
});

// endpoint for posting datas of order form into db
app.post("/add-order", async (req, res) => {
  // get datas from form
  console.log(`DEBUG: Form data`);
  const customerNameFromUI = req.body.customer;
  const addressFromUI = req.body.address;
  const itemSelected = req.body.items;

  //for timestamp
  const today = new Date();

  try {
    if (
      customerNameFromUI === undefined ||
      customerNameFromUI === null ||
      addressFromUI === undefined ||
      addressFromUI === null ||
      itemSelected === undefined ||
      itemSelected === null
    ) {
      return res.render("order-form-page", {
        layout: "my-layouts",
        errMsg: "ERROR: Fill the form to place order!",
      });
    } else {
      // Inserting customer order to db
      let cart = [];
      const items = await Item.find(itemSelected).lean().exec();
      for (let item of items) {
        cart.push({ item: item._id.toString(), quantity: 1, _id: item._id });
      }
      console.log(`cart data is: ${cart}`);
      const customerOrder = new Order({
        customer: customerNameFromUI,
        address: addressFromUI,
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
        status: 0,
        items: cart,
        driver: "",
      });

      const orderResults = await customerOrder.save();

      if (orderResults === null) {
        return res.render("order-form-page", {
          layout: "my-layouts",
          errMsg: "ERROR: Order cannot be placed!",
        });
      } else {
        return res.redirect(`/order-receipt/${orderResults._id}`);
      }
    }
  } catch (err) {
    console.log(err);
    return res.render("order-form-page", {
      layout: "my-layouts",
      errMsg: "ERROR: Order cannot be placed!",
    });
  }
});

// endpoint to get the receipt and confirmation page for customer
app.get("/order-receipt/:orderId", async (req, res) => {
  try {
    let orderReceipt = await Order.findOne({ _id: req.params.orderId })
      .lean()
      .exec();
    // Looping to get item details
    let itemDetails = [];
    for (let item of orderReceipt.items) {
      itemDetails.push(item._id.toString());
    }
    let items = await Item.find({ _id: itemDetails }).lean().exec();
    let total = 0;
    for (let item of items) {
      total += item.price;
    }

    res.render("order-confirmation-page", {
      layout: "my-layouts",
      orderReceiptDetails: orderReceipt,
      orderTotal: total,
      orderedItems: items,
    });
  } catch (err) {
    console.log(err);
  }
});

// Endpoint for order status page showing form to check order
app.get("/order-status", async (req, res) => {
  return res.render("order-status-page", {
    layout: "my-layouts",
  });
});

// endpoint to get the order id and showing its result
app.get("/order-item-status/:orderId", async (req, res) => {
  //get the order id from request body
  const orderIdFromUI = req.params.orderId;

  try {
    const orderResults = await Order.findOne({ _id: orderIdFromUI })
      .lean()
      .exec();
    // console.log(orderResults)

    return res.json(orderResults);
  } catch (err) {
    //status(404) : order not found
    return res.status(404).send({});
  }
});

// ----------------
const onHttpStart = () => {
  console.log("The web server has started...");
  console.log(`Express web server running on port: ${HTTP_PORT}`);
  console.log(`Press CTRL+C to exit`);
};
app.listen(HTTP_PORT, onHttpStart);
