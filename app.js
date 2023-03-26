require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose').default;
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Connect to MongoDB
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
async function main() {
    await mongoose.connect(`mongodb+srv://${db_username}:${db_password}@cluster0.nivlfhq.mongodb.net/todolistDB`);
}
main().catch(err => console.log(err));

//Define Schema & create Model
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please check your todo entry, no name specified!"]
    }
});

const Item = mongoose.model("Item", itemsSchema);

//Items
const item1 = new Item({
    name: "Welcome to your todo list!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//CRUD Operations
async function insertItem(item) {
    const result = await item.save();
    return result;
}
async function insertItems(array) {
    const result = await Item.insertMany(array);
    return result;
}
async function findItems(query) {
    const result = await Item.find(query);
    return result;
}
async function deleteItem(target) {
    const result = await Item.deleteOne(target);
    return result;
}

//Insert Default Items


//Routes
app.get("/", (req, res) => {
    let day = date.getDate();

    //Render items
    findItems()
        .then(foundItems => {
            if(foundItems.length === 0) {
                insertItems(defaultItems)
                    .then(() => console.log("Successfully saved default items to DB"))
                    .catch(err => console.log(err)); //Failure
                res.redirect("/");
            }
            else {
                res.render("list", {listTitle: day, newListItem: foundItems, route: "/"});
            }
        })
        .catch(err => console.log(err));
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const item = new Item({
        name: itemName
    });
    insertItem(item)
        .then(() => {
            console.log("Successfully saved item to DB");
            res.redirect("/");
        })
        .catch(err => {
            console.log(err);
            res.redirect("/");
        }); //Failure
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkBox;
    deleteItem({_id: checkedItemId})
        .then(() => {
            console.log("Successfully deleted checked item!");
            res.redirect("/");
        })   //Success
        .catch(err => console.log(err)); //Failure
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});
