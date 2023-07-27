const sgMail = require('@sendgrid/mail');
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const SENDGRID_API_KEY='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'

sgMail.setApiKey(SENDGRID_API_KEY)

const sendForgotPasswordEmail = (mail, subject, payload, template, r) => {

    const source = fs.readFileSync(path.join(__dirname, template), "utf8");
    const compiledTemplate = handlebars.compile(source);

    sgMail.send({
        to: mail,
        from: 'ridahhussain4@gmail.com',
        subject: subject,
        html: compiledTemplate(payload)
    })
    .then(() => {
        return r.send()
    })
    .catch((error) => {
        return r.status(400).send({ error: 'This email does not exist!' })
    })

    // try {
    //     // create reusable transporter object using the default SMTP transport
    //     const transporter = nodemailer.createTransport({
    //       host: "http://localhost:3000/",
    //       port: 3000,
    //       auth: {
    //         user: Ridah,
    //         pass: process.env.EMAIL_PASSWORD, // naturally, replace both with your real credentials or an application-specific password
    //       },
    //     });
    
    //     const source = fs.readFileSync(path.join(__dirname, template), "utf8");
    //     const compiledTemplate = handlebars.compile(source);
    //     const options = () => {
    //       return {
    //         from: 'ridahhussain4@gmail.com',
    //         to: email,
    //         subject: subject,
    //         html: compiledTemplate(payload),
    //       };
    //     };
    
    //     // Send email
    //     transporter.sendMail(options(), (error, info) => {
    //       if (error) {
    //         return error;
    //       } else {
    //         return res.status(200).json({
    //           success: true,
    //         });
    //       }
    //     });
    //   } catch (error) {
    //     return error;
    //   }

}

module.exports = {
    sendForgotPasswordEmail
}