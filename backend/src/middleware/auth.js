const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'thisisAuthToken')
        
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

// const requestPasswordReset = async (email) => {

//     const user = await User.findOne({ email });

//     if (!user) throw new Error("User does not exist");
//     let token = await Token.findOne({ userId: user._id });
//     if (token) await token.deleteOne();
//     let resetToken = crypto.randomBytes(32).toString("hex");
//     const hash = await bcrypt.hash(resetToken, Number(bcryptSalt));

//     await new Token({
//         userId: user._id,
//         token: hash,
//         createdAt: Date.now(),
//     }).save();

//     const link = `${clientURL}/passwordReset?token=${resetToken}&id=${user._id}`;
//     sendEmail(user.email,"Password Reset Request",{name: user.name,link: link,},"./template/requestResetPassword.handlebars");
//     return link;
// };

module.exports = auth