const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config()

const app = express();

//Connect DB
mongoose.connect(
    process.env.DB_CONNECTION, {
        useNewUrlParser: true
    }, () => console.log('New DB Connection Secured.'));

//Import Routes
const stockRoute = require('./server/routes/stock');

//Middleware
app.use(express.json());

app.use(cors({
    origin: [`${process.env.FRONT_URL}`, 'http://localhost:8000'],
    credentials: true
}));

//Routing Middleware
app.use('/api', stockRoute);

//Listen on port 3000
app.listen(3001, () => console.log('authentication server running at port 3001...'));