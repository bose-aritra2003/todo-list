require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose').default;
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Connect to MongoDB
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
async function main() {
    await mongoose.connect(`mongodb+srv://${db_username}:${db_password}@cluster0.nivlfhq.mongodb.net/todolistDB`);
    // await mongoose.connect(`mongodb://localhost:27017/todolistDB`);
}
main().catch(err => console.log(err));

//Define Schema & create Model
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please check your todo entry, no name specified!"]
    }
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

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


//Routes
app.get("/", async (req, res) => {
    let day = date.getDate();

    //Retrieve items from DB
    await Item.find()
        .then(async foundItems => {
            if(foundItems.length === 0) {
                await Item.insertMany(defaultItems)
                    .then(() => console.log("Successfully saved default items to DB"))
                    .catch(err => console.log(err)); //Failure
                res.redirect("/");
            } else {
                res.render("list", {listTitle: day, newListItem: foundItems});
            }
        })
        .catch(err => console.log(err));
});

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    await List.findOne({ name: customListName }).exec()
        .then(async foundList => {
            if(!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                await list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
            }
        })
        .catch(err => console.log(err));
});

app.post("/", async function (req, res) {
    const itemName = req.body.newItem;
    let listName = req.body.postButton;

    const item = new Item({
        name: itemName
    });

    let day = date.getDate();
    if(listName === day) {
        await item.save()
            .then(() => {
                console.log("Successfully saved item to DB");
                res.redirect("/");
            })
            .catch(err => console.log(err));
    } else {
        await List.findOne({ name: listName }).exec()
            .then(async foundList => {
                foundList.items.push(item);
                await foundList.save()
                    .then(() => {
                        console.log("Successfully saved item to DB");
                        res.redirect("/" + listName);
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    }
});

app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkBox;
    const listName = req.body.listName;

    let day = date.getDate();
    if(listName === day) {
        await Item.deleteOne({_id: checkedItemId})
            .then(() => {
                console.log("Successfully deleted checked item!");
                res.redirect("/");
            })
            .catch(err => console.log(err)); //Failure
    } else {
        await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
            .then(() => {
                res.redirect("/" + listName);
            })
            .catch(err => console.log(err));
    }
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});
