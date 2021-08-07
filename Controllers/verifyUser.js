const async = require("async");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const services = require("../services/sendVeificationEmail");

const prisma = new PrismaClient();

exports.signup = (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        prisma.user
            .findUnique({
                where: {
                    email,
                },
            })
            .then((user) => {
                console.log(user);
                if (user) {
                    if (password == user.password) {
                        const token = jwt.sign(
                            {
                                id: user.id.toString(),
                                email: user.email,
                                verified: user.verified,
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: "7days" }
                        );
                        delete user.password;

                        return res.status(200).json({
                            code: 200,
                            msg: "Login Success",
                            data: {
                                token,
                                user_info: user,
                            },
                        });
                    }
                    return res.status(401).json({
                        code: 401,
                        msg: "User already exists",
                    });
                } else {
                    prisma.user
                        .create({
                            data: {
                                email,
                                password,
                                verified: false,
                            },
                        })
                        .then(async (user) => {
                            const token = jwt.sign(
                                {
                                    id: user.id.toString(),
                                    email: user.email,
                                    verified: user.verified,
                                },
                                process.env.JWT_SECRET,
                                { expiresIn: "7days" }
                            );
                            delete user.password;
                            await services.sendVerificationEmail(
                                email,
                                user.email,
                                user.id,
                                process.env.email_password
                            );

                            return res.status(200).json({
                                code: 200,
                                msg: "Login Success",
                                data: {
                                    token,
                                    user_info: user,
                                },
                            });
                        });
                }
            })
            .catch((err) => {
                res.status(500).send({ code: 500, msg: "Internal server error" });
            });
    } catch (e) {
        return res.status(500).json({ code: 500, msg: "Internal server error" });
    }
};

exports.verify_user = (req, res) => {
    try {
        const given_hash = req.query.token;
        const id = parseInt(req.query.id);
        prisma.user
            .findUnique({
                where: {
                    id,
                },
            })
            .then(async (user) => {
                if (user) {
                    const calulated_hash = await services.verifyHash(user.email);

                    if (calulated_hash == given_hash) {
                        prisma.user
                            .update({
                                where: {
                                    id: id,
                                },
                                data: {
                                    verified: true,
                                },
                            })
                            .then(() => {
                                res.redirect(307, "http://localhost:3002/verified");
                            });
                    } else {
                        res.redirect(307, "https://google.com");
                    }
                } else {
                    res.redirect(307, "https://google.com");
                }
            })
            .catch(() => {
                res.redirect(307, "https://google.com");
            });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ code: 500, msg: "Internal server error" });
    }
};

exports.jwtVerify = (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const id = parseInt(decoded.id);

        prisma.user
            .findUnique({
                where: {
                    id,
                },
            })
            .then(async (user) => {
                if (user) {
                    delete user.password;
                    res.status(200).json({ data: user });
                } else {
                    return res.status(401).send("Not authorized");
                }
            })
            .catch(() => {
                return res.status(401).send("Not authorized");
            });
    } catch (e) {
        return res.status(401).send("Not authorized");
    }
};
