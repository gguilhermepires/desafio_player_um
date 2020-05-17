const User = require('../models/User');
const Place = require('../models/Place');

//login
exports.get_login_page = (req, res, next) => {

    let msg_form_erro = req.flash('msg_form_erro');
    if (msg_form_erro.length > 0) {
        msg_form_erro = msg_form_erro[0];
    } else {
        msg_form_erro = null;
    }

    res.render('admin/login.ejs', {
        page_title: 'Login',
        page_subtitle: "Login",
        user: req.session.user,
        msg_form_erro: msg_form_erro,
    });
};
exports.post_login = (req, res, next) => {
    const { pass, email } = req.body;

    User.findOne({ where: { email: email } }).then(u => {

        var sha256 = require('sha256');

        if (u.password == sha256(pass)) {

            u.senha = "";
            req.session.user = u;
            req.session.isLoggedIn = true;
            req.session.save((err) => {
                res.redirect('/');
            });

        } else {
            req.flash('msg_form_erro', 'Senha ou e-mail incorretos');
            req.session.save(function (err) {
                res.redirect('/login');
            });
        }
    }).catch(err => {
        req.flash('msg_form_erro', 'Não foi possível fazer o login. Tente de novo mais tarde');
        req.session.save(function (err) {
            res.redirect('/login');
        });
    });
};
exports.get_logOut = (req, res, next) => {

    req.session.destroy((err) => {
        res.redirect('/');
    });
};

//place
exports.get_place_index = (req, res, next) => {

    Place.findAll().then(list => {
        res.render('admin/place/place', {
            paginaTitulo: 'Cadastro de lugares',
            pagina_titulo: "Cadastro de lugares",
            url_page: "/admin/place",
            list_place: list,
            user: req.session.user
        });
    })
};

exports.get_add_place_index = (req, res, next) => {

    let msg_form = req.flash('msg_form');
    if (msg_form.length > 0) {
        msg_form = msg_form[0];
    } else {
        msg_form = null;
    }
    let msg_form_erro = req.flash('msg_form_erro');
    if (msg_form_erro.length > 0) {
        msg_form_erro = msg_form_erro[0];
    } else {
        msg_form_erro = null;
    }
    res.render('admin/place/place_add', {
        page_title: 'Cadastro lugar',
        page_subtitle: "Adicionar lugar",
        user: req.session.user,
        msg_form_erro: msg_form_erro,
        msg_form: msg_form
    });
};
exports.get_edit_place_index = (req, res, next) => {

    let msg_form = req.flash('msg_form');
    if (msg_form.length > 0) {
        msg_form = msg_form[0];
    } else {
        msg_form = null;
    }

    let msg_form_erro = req.flash('msg_form_erro');
    if (msg_form_erro.length > 0) {
        msg_form_erro = msg_form_erro[0];
    } else {
        msg_form_erro = null;
    }

    const id = req.params.id;

    Place.findOne({ where: { id: id } }).then(place => {
        if (place != undefined) {
            res.render('admin/place/place_edit', {
                page_title: 'Alteração de lugar',
                page_subtitle: "Alteração de lugar",
                user: req.session.user,
                place: place,
                msg_form_erro: msg_form_erro,
                msg_form: msg_form
            });
        } else {
            res.redirect("/")
        }
    })
};

exports.delete_place = (req, res, next) => {
    const id = req.params.id;

    Place.findOne({ where: { id: id } }).then(place => {
        console.log("place::", place);
        if (place != undefined) {
            console.log("Achou o lugar");

            Place.destroy({ where: { id: id } }).then(r => {
                if (r)
                    res.sendStatus(200);
                else {
                    console.log(r);
                    res.sendStatus(400);
                }
            });
        } else {
            console.log("nao achou");
            res.sendStatus(400);
        }
    }).catch(e => {
        console.log("erro achar lugar");
        res.sendStatus(400);
    });
};

exports.post_add_place = (req, res, next) => {
    const file = req.file;
    const { form_name, form_description } = req.body;

    var valid = true;

    if (!file) {
        req.flash('msg_form_erro', 'Selecione uma imagem');
        valid = false;
    } else if (!form_name) {
        req.flash('msg_form_erro', 'O campo nome não pode ser vazio');
        valid = false;
    }

    if (valid) {
        Place.create({
            name: form_name,
            image_URL: "\\img\\uploads\\" + req.file.filename,
            description: form_description
        }).then(r => {
            req.flash('msg_form', 'Lugar adiconado com sucesso');
            req.session.save(function (err) {
                res.redirect("/admin/place/add")
            });
        });
    } else {
        req.session.save(function (err) {
            res.redirect("/admin/place/add")
        });
    }
};

exports.post_edit_place = (req, res, next) => {
    const file = req.file;
    const { id, form_name, form_description } = req.body;

    Place.findOne({ where: { id: id } }).then(place => {
        if (place != undefined) {

            if (!form_name) {
                req.flash('msg_form_erro', 'O campo nome não pode ser vazio');
            } else {
                place.name = form_name;
                place.description = form_description;

                if (file != undefined)
                    place.image_URL = "\\img\\uploads\\" + req.file.filename;

                place.save();

                req.flash('msg_form', 'Lugar alterado com sucesso');
            }

            req.session.save(function (err) {
                res.redirect("/admin/place/edit/" + id)
            });
        }
    });
};