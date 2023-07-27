const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }, 
    email: {
        type: String,
        required: true,
        trim: true,
        unique: 'This email is already in use',
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    phone: {
        type: Number,
        required: true,
        trim: true,
        unique: 'Phone numeber address already in use!'
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7
    },
    admin: {
        type: Boolean,
        default: false,
        trim: true,
        required: true
    },
    picture: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

})

userSchema.set('toJSON', { 
    transform: function(doc, ret, options) 
    { 
        delete ret.password; 
        delete ret.tokens; 
        return ret;
    } 
});

userSchema.statics.findByCredentials = async (inputData, password) => {
    let user = await User.findOne({ email: inputData })
    if (!user) {
        user = await User.findOne({ phone : inputData })
        if (!user) {
            return false
        }
    }

    const isMatch = await bcrypt.compare(password, user.password)  
    if (!isMatch) {
        return false
    }
    return user
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, "thisisAuthToken", { expiresIn: '6h' })
    
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.updateData = async function (updates, res, req) {
    try {
        const user = this
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (err) {
        if(err.keyValue){
            res.status(400).send({error: Object.keys(err.keyValue)+' is repeated'})
        } else {
            res.status(400).send({error: err.message})
        }
    }
    
}

userSchema.pre('save', async function (next) {
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8)
    }
    next()
})
userSchema.plugin(beautifyUnique);
const User = mongoose.model('User', userSchema )

module.exports = User