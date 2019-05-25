//jshint esversion:8
const express = require('express');
const router = express.Router();




router.get('/', (req, res, next) => {
  res.status(200).render('homeUser');
});



module.exports = router;
