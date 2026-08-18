import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendverificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    const {email, password, name} = req.body;

    try {
        if(!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const userAlreadyExists = await User.findOne({email});
        if (userAlreadyExists) {
            return res.status(400).json({success:false, message: "user already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken: verificationCode,
            verifiationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hrs
        })

        await user.save();

        //jwt
        generateTokenAndSetCookie(res, user._id);

        await sendverificationEmail(user.email, user.verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        res.status(400).json({success:false, message: error.message});
    }
};

export const verifyEmail = async (req, res) => {
    const {code} = req.body;
    try {
        const user = await User.findOne( {
            verificationToken: code,
            verifiationTokenExpiresAt: { $gt: Date.now() }
        })

        if(!user) {
            return res.status(400).json({success: false, message: "Invalid or expired verification code"})
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verifiationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail( user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch(error){
        console.log("error in verifyemail", error);
        res.status(500).json({success:false, message: "Server error"});
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({ success: false, message: "invalid credentials"});
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({success: false, message: "Invalid Credentails"});
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login", error);
        res.status(400).json({ success: false, message: error.message});       
    }
};

export const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({ email });
    } catch (error) {
        
    }
}

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Logged out successfully"});
};