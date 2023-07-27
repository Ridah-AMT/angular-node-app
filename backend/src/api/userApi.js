const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs')
const multer = require('multer')

const { sendForgotPasswordEmail } = require('../emails/sendEmail')
const router = new express.Router()

// call on sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user , token })
    } catch (e) {
        res.status(400).send({ error: Object.keys(e.keyPattern)[0] + ' is already in use' })
    }
})

//user login
router.post('/user/login', async (req, res) => {
    try {
        const loginData = req.body.email || req.body.phone
        const password = req.body.password
        const user = await User.findByCredentials(loginData, password)
        if(!user) {
            return res.status(400).send({ error: 'Email and password do not match!' })
        }
        const token = await user.generateAuthToken()
        res.send({ user , token })
    } catch (e) {
        res.status(400).send({ error: 'User does not exist!' })
    }
})

// get user data
router.get('/users/me', auth, async (req, res) => {
    try {
        await res.send(req.user)
    } catch (e) {
        res.status(400).send({ error: 'Could not get user details' })
    }
})

//user logout
router.post('/user/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(400).send({ error: 'Could not logout' })
    }
})

//Logout all - removes one users all tokens
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// get all users data
router.get('/usersList', (req, res) => {
    try {
        User.find({})
        .then(function (users) {
            res.send(users);
        });
    } catch (e) {
        res.status(400).send({ error: 'Could not get the user list' })
    }
});

//update data
router.patch('/users', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['_id', 'name', 'email', 'password', 'phone', 'admin']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    let passwordUpdate = false
    if (!isValidOperation) {
        const passwordUpdates = ['_id','prePassword', 'password']
        const isValidOperation = updates.every((update) => passwordUpdates.includes(update))
        if(!isValidOperation){
            return res.status(400).send({ error: 'Invalid updates!' })
        }
        passwordUpdate = true
    }
    try {
        const user = await User.findById(req.body._id)
        if(passwordUpdate){
            bcrypt.compare(req.body.prePassword, user.password, async function (e, r) {
                if(e) {
                    return await res.status(400).send({ error: 'Coudnt not change the password' })
                }
                if (r) {
                    await user.updateData(updates, res, req)
                } else {
                    return await res.status(400).send({ error: "wrong previous password"})
                }
            });
        }
        else {
            await user.updateData(updates, res, req)
        }
    } catch (e) {
        return res.status(400).send({error: 'Data entered was not correct' })
    }
})

//delete user by id
router.get('/delete/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndRemove(req.params.id, req.body, {new: true, runValidators: true})
        if(!user) {
            res.status(400).send({ error: 'User not found' })
        }
        res.send(user)
    } catch (e) {
        res.status(400).send({ error: 'Could not delete the user' })
    }
    
})

//forget password API
router.post('/user/forget-password', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if(!user) {
        return res.status(400).send({ error: 'Cound find this user, please enter correct email!' })
    }

    const link = `localhost:3000/reset-password-form.html?id=${user._id}`;

    req.headers["host"]

    sendForgotPasswordEmail(
        user.email,
        "Password Reset Request",
        {
          name: user.name,
          link: link,
        },
        "../templates/views/edit-password.hbs",
        res
    );
    return { link };

})

//upload Image
const upload = multer({
    limits: {
        fileSize: 1000000
    }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
})

router.post('/user/picture', auth, upload.single('picture'), async (req, res) => {
    req.user.picture = req.file.buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

module.exports = router