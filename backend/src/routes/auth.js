const express = require("express");
const router = require("express").Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
    try {
        const {name, username, email, password} = req.body;
        console.log("Received user:", name, email);

        const existingUser = await User.findOne({email})
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const existingUsername = await User.findOne({username})
        if (existingUsername) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: password,
            eventsAttending: [],
            eventsWaitlisted: []
        })

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            userId: newUser._id
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body;
        console.log("Trying to log in user:", username);

        const user = await User.findOne({username: username})
        if (!user) {
            return res.status(400).json({ error: "Incorrect username or password." });
        }
        if (user.password !== password) {
            return res.status(400).json({ error: "Incorrect username or password." });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
        );

        return res.status(200).json({
            message: "Login successful",
            token: token,
            userId: user._id
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;