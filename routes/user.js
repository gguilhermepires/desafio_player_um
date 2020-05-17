const express = require('express');
const controller = require('../controllers/user');

const router = express.Router();

router.get('/',controller.get_index);

module.exports = router;