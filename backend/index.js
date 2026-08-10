import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.send("Hello 12");
});

app.listen(3000, () => {
    console.log("Server is running");
});

m2y1U4BwwmvjUWpI;