const express = require('express');
const controller = require('../controllers/admin');
const path = require('path');
var multer = require('multer');

const router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
var upload = multer({ storage: storage })

// login 
router.get('/login', controller.get_login_page);

router.get('/logout', controller.get_logOut);

router.post('/login', controller.post_login);

// place
router.get('/admin/place', controller.get_place_index);

router.get('/admin/place/add', controller.get_add_place_index);

router.get('/admin/place/edit/:id', controller.get_edit_place_index);

router.delete('/admin/place/:id', controller.delete_place);

router.post('/admin/place/add', upload.single('myFile'), controller.post_add_place);

router.post('/admin/place/edit/', upload.single('myFile'), controller.post_edit_place);

module.exports = router;