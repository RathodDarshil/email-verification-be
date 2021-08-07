var crypto = require("crypto");
const algorithm = "aes-256-cbc";
const nodemailer = require("nodemailer");

const services = {
    sendVerificationEmail: async function sendVerificationEmail(token, email, id, email_password) {
        try {
            const final_hash = crypto
                .pbkdf2Sync(token.toString(), `${process.env.JWT_SECRET}`, 1000, 64, `sha512`)
                .toString(`hex`);

            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "thedarshilrathod@gmail.com", // generated ethereal user
                    pass: email_password, // generated ethereal password
                },
            });

            let info = await transporter.sendMail({
                from: '"thedarshilrathod" <thedarshilrathod@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Email Verification", // Subject line
                text: `https://email-verification-be.herokuapp.com/api/user/verify?token=${final_hash}&id=${id}`,
            });
            console.log("Message sent: %s", info.messageId);
        } catch {
            return false;
        }
    },
    verifyHash: async function verifyHash(token) {
        const final_hash = crypto
            .pbkdf2Sync(token.toString(), `${process.env.JWT_SECRET}`, 1000, 64, `sha512`)
            .toString(`hex`);

        return final_hash;
    },
};

module.exports = services;
