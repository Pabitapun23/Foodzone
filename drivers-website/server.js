const express = require("express")
const app = express()
const exphbs = require('express-handlebars');
const session = require('express-session');
const multer = require("multer")
const path = require("path")
const myStorage = multer.diskStorage({
    destination: path.join(__dirname,"/public/deliveryEvidence"),
    filename: function(req,file,cb){
        cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({storage: myStorage})
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


const OrderStatus = {
    RECEIVED:0,
    READY_FOR_DELIVERY:1,
    IN_TRANSIT:2,
    DELIVERED:3,
}
const driverSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    vehicle: String,
    color: String,
    license: String,
})

const orderSchema = new mongoose.Schema({
    customer: String,
    address: String,
    timestamp: String,
    status: Number, //0 = received, 1 = ready for delivery, 2 = in transit, 3 = delivered
    items: [{
        item: mongoose.Schema.Types.ObjectId,
        quantity: Number,
    }],
    driver: String,
    imgFilename: String,
})

const itemSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    price: Number,
    featured: Boolean,
})
const driverAccount = mongoose.model("drivers_collections", driverSchema)
const order = mongoose.model("orders_collections", orderSchema)
const item = mongoose.model("items_collections", itemSchema)
/******************* Database setup ********************/

/******************* Session middleware setup ********************/
const sessionQuery = (req, res, next) => {
    if (req.session.driverInfo) {
        return next()
    }
    return res.redirect("/login")
}
/******************* Session middleware setup ********************/

app.get("/",sessionQuery,(req, res) => {
    return res.redirect("/dashboard")
})

app.get("/login", (req, res) => {
    return res.render("login.hbs",{layout: "header-footer.hbs", login: true})
})

app.post("/login", async(req, res) => {
   try{ 
    const driverFromDB = await driverAccount.findOne({username: req.body.username})
    if(!driverFromDB){
        return res.render("login.hbs",{layout: "header-footer.hbs", error: "User does not exist"})
    }
    if(driverFromDB.password !== req.body.password){
        return res.render("login.hbs",{layout: "header-footer.hbs", error: "Password is incorrect"})
    }
    //set session
    req.session.driverInfo = {
        username: driverFromDB.username,
        id: driverFromDB._id,
        name: driverFromDB.name,
        vehicle: driverFromDB.vehicle,
        color: driverFromDB.color,
        license: driverFromDB.license
    };
    //
    return res.redirect("/dashboard")
    }
    catch(error){
        console.log(error)
    }
})

app.get("/register",(req,res)=>{
    return res.render("register.hbs",{layout: "header-footer.hbs"})
})

app.post("/register",async (req,res)=>{
    try{
        const driver = await driverAccount.findOne({username: req.body.username})
        if(driver){
            return res.render("register.hbs",{layout: "header-footer.hbs", error: "Username already exists"})
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
        return res.redirect("/dashboard");
    } catch(error){
        console.log(error)
    }
})

app.get("/logout", (req, res) => {
    req.session.destroy()
    return res.redirect("/login")
})
app.get("/dashboard",sessionQuery, async (req, res) => {
    const finalOrderList=[]
    const orderList = await order.find({status: OrderStatus.READY_FOR_DELIVERY, driver:""}).lean().exec()
    
    for(let i=0;i<orderList.length;i++){
        const orderItems=[]
        for(let j=0;j<orderList[i].items.length;j++){
            const items = await item.findById(orderList[i].items[j].item).lean().exec()
            orderItems.push({
                name: items.name,
                quantity: orderList[i].items[j].quantity
            })
        }
        finalOrderList.push({
            id: orderList[i]._id,
            customer: orderList[i].customer,
            address: orderList[i].address,
            date: orderList[i].timestamp,
            status: orderList[i].status,
            items: orderItems,
            totalItems: orderList[i].items.length,
        })
    }
    return res.render("dashboard.hbs",{layout: "header-footer.hbs", orderList: finalOrderList})
})

app.get("/record",sessionQuery, async(req,res)=>{
    try{
        const finalOrderList=[]
        const orderList = await order.find({driver: req.session.driverInfo.id, status:OrderStatus.DELIVERED}).lean().exec()
        console.log("orderList:", orderList)
        for(let i=0;i<orderList.length;i++){
            const orderItems=[]
            for(let j=0;j<orderList[i].items.length;j++){
                const items = await item.findById(orderList[i].items[j].item).lean().exec()
                orderItems.push({
                    name: items.name,
                    quantity: orderList[i].items[j].quantity
                })
            }
            finalOrderList.push({
                id: orderList[i]._id,
                customer: orderList[i].customer,
                address: orderList[i].address,
                date: orderList[i].timestamp,
                status: orderList[i].status,
                items: orderItems,
                totalItems: orderList[i].items.length,
                imgFilename: orderList[i].imgFilename
            })
        }
        return res.render("record.hbs",{layout: "header-footer.hbs", orderList: finalOrderList})
    }catch(error){
        console.log(error)
    }
})

app.get("/order",sessionQuery, async(req,res)=>{
    try{
        const finalOrderList=[]
        const orderList = await order.find({driver: req.session.driverInfo.id, status:OrderStatus.IN_TRANSIT}).lean().exec()
        for(let i=0;i<orderList.length;i++){
            const orderItems=[]
            for(let j=0;j<orderList[i].items.length;j++){
                const items = await item.findById(orderList[i].items[j].item).lean().exec()
                orderItems.push({
                    name: items.name,
                    quantity: orderList[i].items[j].quantity
                })
            }
            finalOrderList.push({
                id: orderList[i]._id,
                customer: orderList[i].customer,
                address: orderList[i].address,
                date: orderList[i].timestamp,
                status: orderList[i].status,
                items: orderItems,
                totalItems: orderList[i].items.length,
                imgFilename: orderList[i].imgFilename
            })
        }
        return res.render("driverOrder.hbs",{layout: "header-footer.hbs", orderList: finalOrderList})
    }catch(error){
        console.log(error)
    }
})

app.post("/order",sessionQuery, async (req, res) => {
    try{
        const orderId = req.body.orderId
        await order.updateOne({_id: orderId},{$set: {driver: req.session.driverInfo.id, status: OrderStatus.IN_TRANSIT}})
        return res.redirect("/dashboard")
    }catch(error){
        console.log(error)
    }
})

app.post("/delivered",sessionQuery,upload.single("evidenceImage"), async(req,res)=>{
    try{
        const updateOrderParams = {
            status: OrderStatus.DELIVERED,
            imgFilename: req.file.filename,
        }
        await order.updateOne({_id: req.body.orderId},{$set: updateOrderParams});
        res.redirect("/order")
    }catch(error){
        console.log(error)
    }
})

app.post("/resubmit",sessionQuery,upload.single("evidenceImage"), async(req,res)=>{
    try{
        const updateOrderParams = {
            imgFilename: req.file.filename,
        }
        await order.updateOne({_id: req.body.orderId},{$set: updateOrderParams});
        res.redirect("/record")
    }catch(error){
        console.log(error)
    }
})

app.listen(HTTP_PORT, () => {
    console.log("Server is running on port 3000")
})