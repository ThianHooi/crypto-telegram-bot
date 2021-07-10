var express = require("express");
var router = express.Router();
var telegramController = require("../controller/telegram.controller");

router
  .get("/", function (req, res, next) {
    res.send("respond with a resource");
  })
  .post("/", telegramController.sendMessage);

// router.post("/webhook", telegramController.handleWebhook);

module.exports = router;
