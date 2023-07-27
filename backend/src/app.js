const path= require('path')
const express = require('express')
var cors = require('cors')
require('./db/mongoose')
const userApi = require('./api/userApi')

// console.log(__dirname)
// console.log(path.join(__dirname, './templates/views'))

const app = express()

app.use(cors());
app.use(express.json())
app.use(userApi)
app.use(express.static(path.join(__dirname, './templates/views')))

app.get('', (req, res) => {
    res.send('hello !!')
})

module.exports = app