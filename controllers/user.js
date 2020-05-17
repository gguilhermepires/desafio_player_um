const User = require('../models/user');
const Place = require('../models/place');
const util = require('../util/util');

const sequelize = require('../util/database').sequelize;
const { QueryTypes } = require('sequelize');

exports.get_index = (req, res, next) => {
    var list_place = [];

    let msg_form_erro = req.flash('msg_form_erro');
    if (msg_form_erro.length > 0)
        msg_form_erro = msg_form_erro[0];
    else
        msg_form_erro = null;

    sequelize.sync().then(async _ => {

        list_place = await Place.findAll();

        res.render('user/index', {
            page_title: "Desafio player 1",

            list_place: list_place,
            
            user: req.session.user,
            socket_server: util.socket_server,
            msg_form_erro: msg_form_erro
        });
    });//fim sync banco
};


exports.getLoginPage_entrar = async (req, res, next) => {
    const usuarioEmail = req.body.email;
    try {
        var text = req.body.senha;
        // An example 128-bit key (16 bytes * 8 bits/byte = 128 bits)
        var key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

        // Convert text to bytes
        var textBytes = aesjs.utils.utf8.toBytes(text);

        // The counter is optional, and if omitted will begin at 1
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var encryptedBytes = aesCtr.encrypt(textBytes);

        // To print or store the binary data, you may convert it to hex
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        console.log(encryptedHex);
        // "a338eda3874ed884b6199150d36f49988c90f5c47fe7792b0cf8c7f77eeffd87
        //  ea145b73e82aefcf2076f881c88879e4e25b1d7b24ba2788"

        // When ready to decrypt the hex string, convert it back to bytes
        var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);

        // The counter mode of operation maintains internal state, so to
        // decrypt a new instance must be instantiated.
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var decryptedBytes = aesCtr.decrypt(encryptedBytes);

        // Convert our bytes back into text
        var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
        console.log(decryptedText);
        // "Text may be any length you wish, no padding is required."

        Usuario.findOne({ where: { email: usuarioEmail } }).then(u => {
            if (u.senha == encryptedHex) {
                req.app.set('usuarioId', u.id)
                req.app.set('usuarioEmail', usuarioEmail)
                res.redirect('/')
            } else {
                res.render('usuario/loginPage', {
                    pageTitle: 'Shop',
                    isAuthenticated: req.isAuthenticated,
                    path: '/'
                });
            }
        }).catch(err => {
            console.log("não acho" + err);
            res.render('usuario/loginPage', {
                pageTitle: 'Shop',
                isAuthenticated: req.isAuthenticated,
                path: '/'
            });
        }); //fim busca usuario

    } catch (e) {
        console.log("Erro" + e.toString());
        res.render('usuario/loginPage', {
            pageTitle: 'Shop',
            isAuthenticated: req.isAuthenticated,
            path: '/'
        });
    }
};
exports.getEsqueciSenhaPage = (req, res, next) => {

    let msg_cadastro_erro = req.flash('msg_cadastro_erro');
    if (msg_cadastro_erro.length > 0)
        msg_cadastro_erro = msg_cadastro_erro[0];
    else
        msg_cadastro_erro = null;

    res.render('usuario/esqueci_senha', {
        pageTitle: 'esqueci_senha',
        errorMessage: msg_cadastro_erro,
        isAuthenticated: req.isAuthenticated,
        path: '/esqueciSenhaPage'
    });
};
exports.postEsqueciSenhaPage = (req, res, next) => {
    var email = req.body.email;
    if (email) {
        sequelize.sync().then(async _ => {
            var usuarioBanco = await Usuario.findOne({ where: { email: email } });
            var sha256 = require('sha256');
            let r = Math.random().toString(36).substring(7);
            usuarioBanco.senha = sha256(r);
            if (usuarioBanco.save()) {
                const transporter = nodemailer.createTransport({
                    host: "smtp.skymail.net.br",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: "desenvolvimento@clsinfo.com.br",
                        pass: "D5e@Vi7nFGR%"
                    },
                    tls: { rejectUnauthorized: false }
                });
                var texto =
                    "\n Recuperação de senha" +
                    "\n Senha: " + r;

                var mailOptions2 = {
                    from: "desenvolvimento@clsinfo.com.br",
                    to: usuarioBanco.email,
                    subject: "Recuperação senha",
                    text: texto
                };

                transporter.sendMail(mailOptions2, function (error, info) {
                    if (error) {
                        console.log("Erro ao enviar");
                        req.flash('msg_cadastro_erro', 'Não foi possível recuperar senha.Tente de novo mais tarde.');
                        req.session.save(function (err) {
                            res.redirect('/esqueciSenha');
                        });
                    }
                    else {
                        console.log("enviado com sucesso")
                        req.flash('msg_cadastro_erro', 'O e-mail foi enviado com sucesso');
                        req.session.save(function (err) {
                            res.redirect('/esqueciSenha');
                        });
                    };
                }); //
            } else {
                req.flash('msg_cadastro_erro', 'O sitema não possui usuário cadastrado com esse e-mail');
                valida = false;
                req.session.save(function (err) {
                    res.redirect('/esqueciSenha');
                });
            }
        });
    } else {
        req.flash('msg_cadastro_erro', 'O campo email não pode ser vazio');
        valida = false;
        req.session.save(function (err) {
            res.redirect('/esqueciSenha');
        });
    }


};
exports.getRegistroPage = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('usuario/criarContaPage', {
        pageTitle: 'Shop',
        errorMessage: message,
        path: '/'
    });
};

exports.criarConta = (req, res, next) => {

    const uNome = req.body.uNome;
    const uEmail = req.body.uEmail;
    const uTelefone = req.body.uTelefone;
    const uSenha = req.body.uSenha;
    const uRepetirSenha = req.body.uRepetirSenha;

    var valida = true;
    if (uNome == "") {
        req.flash('error', 'O campo nome não pode ser vazio');
        valida = false;
        req.session.save(function (err) {
            res.redirect('/criarConta');
        });
    } else
        if (uEmail == "") {
            req.flash('error', 'O campo email não pode ser vazio');
            valida = false;
            req.session.save(function (err) {
                res.redirect('/criarConta');
            });
        } else
            if (uTelefone == "") {
                req.flash('error', 'O campo telefone não pode ser vazio');
                valida = false;
                req.session.save(function (err) {
                    res.redirect('/criarConta');
                });
            } else
                if (uRepetirSenha != uSenha) {
                    req.flash('error', 'O campo senha tem que ser igual o campo repetir senha');
                    valida = false;
                    req.session.save(function (err) {
                        res.redirect('/criarConta');
                    });
                }
    if (valida) {
        Usuario.findOne({ where: { email: uEmail } }).then(usuario => {
            if (usuario) {
                req.flash('error', 'Já existe uma conta com esse email');
                req.session.save(function (err) {
                    res.redirect('/criarConta');
                });
            } else {
                Usuario.create({
                    nome: uNome,
                    telefone: uTelefone,
                    email: uEmail,
                    senha: uSenha,
                    tokenFirebase: "vazio"
                }).then(u => {
                    ConfiguracaoUsuario.create({
                        valorMax: 30,
                        valorMin: 20,
                        emailAlerta: "vazio",
                        telefoneAlerta: "vazio",
                        switch_alerta: true,
                        switch_email: false,
                        switch_whatsapp: false,
                        switch_sms: false,
                        switch_telefone: false,
                        switch_login: false,
                        usuarioId: u.id
                    }).then(_ => {
                        req.flash('error', 'Conta criada com sucesso.');
                        req.session.save(function (err) {
                            res.redirect('/criarConta');
                        });
                    }).catch(_ => {
                        req.flash('error', 'Não foi possível criar uma conta. Tente de novo mais tarde.');
                        req.session.save(function (err) {
                            res.redirect('/criarConta');
                        });
                    });
                }).catch(_ => {
                    req.flash('error', 'Não foi possível criar uma conta. Tente de novo mais tarde.');
                    req.session.save(function (err) {
                        res.redirect('/criarConta');
                    });
                });
            }//fim else
        }).catch(_ => {
            console.log("eero");
            req.flash('error', 'Não foi possível criar uma conta. Tente de novo mais tarde.');
            req.session.save(function (err) {
                res.redirect('/criarConta');
            });
        })
    }
};


exports.getCadastroUsuario = (req, res, next) => {

    let msg_cadastro = req.flash('msg_cadastro');
    if (msg_cadastro.length > 0)
        msg_cadastro = msg_cadastro[0];
    else
        msg_cadastro = null;

    let msg_cadastro_erro = req.flash('msg_cadastro_erro');
    if (msg_cadastro_erro.length > 0)
        msg_cadastro_erro = msg_cadastro_erro[0];
    else
        msg_cadastro_erro = null;

    let msg_cadastro_exclusao = req.flash('msg_cadastro_exclusao');
    if (msg_cadastro_exclusao.length > 0)
        msg_cadastro_exclusao = msg_cadastro_exclusao[0];
    else
        msg_cadastro_exclusao = null;

    let msg_cadastro_exclusao_erro = req.flash('msg_cadastro_exclusao_erro');
    if (msg_cadastro_exclusao_erro.length > 0)
        msg_cadastro_exclusao_erro = msg_cadastro_exclusao_erro[0];
    else
        msg_cadastro_exclusao_erro = null;

    var listaUsuario;
    sequelize.sync().then(async _ => {
        const usuario = req.session.usuario;
        switch (usuario.privilegioId) {
            case 1://superusuario
                listaUsuario = await sequelize.query("SELECT * FROM `usuarios`", { type: QueryTypes.SELECT });
                break;
            case 2://adm 
                /*
                    var sql = `SELECT
              
                    usuarios.id ,
                    usuarios.usuarioId,
                    usuarios.nome as usuarioNome,
                    usuarios.email,
                    usuarios.telefone,
                    usuarios.privilegioId
                 FROM 
                    usuarios
                 WHERE
                    usuarios.usuarioId=`+ usuario.id;
    */
                var sql = `SELECT
          
                usuarios.id ,
                usuarios.usuarioId,
                usuarios.nome as usuarioNome,
                usuarios.email,
                usuarios.telefone,
                usuarios.privilegioId
             FROM 
                usuarios, visualizacaousuariousuarios
             WHERE
             usuarios.id = visualizacaousuariousuarios.usuarioId and
             visualizacaousuariousuarios.donoId=`+ usuario.id;

                listaUsuario = [];
                lista = await sequelize.query(sql, { type: QueryTypes.SELECT });
                lista.forEach(element => {
                    listaUsuario.push({
                        id: element.id,
                        usuarioId: element.usuarioId,
                        nome: element.usuarioNome,
                        email: element.email,
                        telefone: element.telefone,
                        privilegioId: element.privilegioId,
                    });
                });
                break;
        }//fim switch

        res.render('usuario/cadastro/cadastro_usuario', {
            paginaTitulo: 'MSPIOT cadastro usuário',
            pagina_titulo: "Cadastro de usuário",
            url_cadastro: "/cadastro/usuario",
            listaUsuario: listaUsuario,
            usuario: req.session.usuario,

            msg_cadastro: msg_cadastro,
            msg_cadastro_erro: msg_cadastro_erro,

            msg_cadastro_exclusao: msg_cadastro_exclusao,
            msg_cadastro_exclusao_erro: msg_cadastro_exclusao_erro
        });
    }).catch(e => {
        console.log("erro banco:", e);
    });
};
exports.addUsuario = (req, res, next) => {
    try {
        const id = req.body.id;
        const uNome = req.body.nome;
        const uEmail = req.body.email;
        const uTelefone = req.body.telefone;
        var uSenha = req.body.senha;
        const uRepetirSenha = req.body.repetir_senha;
        const uPrivilegioId = req.body.cboPrivilegio;

        var valida = true;
        if (uNome == "") {
            req.flash('msg_cadastro_erro', 'O campo nome não pode ser vazio');
            valida = false;
            req.session.save(function (err) {
                res.redirect('/cadastro/usuario');
            });
        } else
            if (uEmail == "") {
                req.flash('msg_cadastro_erro', 'O campo email não pode ser vazio');
                valida = false;
                req.session.save(function (err) {
                    res.redirect('/cadastro/usuario');
                });
            } else
                if (uTelefone == "") {
                    req.flash('msg_cadastro_erro', 'O campo telefone não pode ser vazio');
                    valida = false;
                    req.session.save(function (err) {
                        res.redirect('/cadastro/usuario');
                    });
                } else
                    if (uRepetirSenha != uSenha) {
                        req.flash('msg_cadastro_erro', 'O campo senha tem que ser igual o campo repetir senha');
                        valida = false;
                        req.session.save(function (err) {
                            res.redirect('/cadastro/usuario');
                        });
                    }


        var sha256 = require('sha256');
        uSenha = sha256(uSenha);
        sequelize.sync().then(async _ => {

            var usuarioBanco = await Usuario.findOne({ where: { email: uEmail } });
            if (valida) {
                if (usuarioBanco) {
                    if (!id) {
                        req.flash('msg_cadastro_erro', 'Já possui usuário com esse e-mail');
                        valida = false;
                        req.session.save(function (err) {
                            res.redirect('/cadastro/usuario');
                        });
                    }
                }
            }

            if (valida) {
                var usuario = req.session.usuario;

                switch (usuario.privilegioId) {
                    case 1://superusuario

                        if (id) {
                            usuarioBanco = await Usuario.findOne({ where: { id: id } });
                            usuarioBanco.nome = uNome;
                            usuarioBanco.telefone = uTelefone;
                            usuarioBanco.email = uEmail;

                            if (uSenha)
                                usuarioBanco.senha = uSenha;

                            usuarioBanco.privilegioId = uPrivilegioId;
                            usuarioBanco.tokenFirebase = "vazio"
                            if (usuarioBanco.save()) {
                                req.flash('msg_cadastro', 'Usuário atualizado com sucesso.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            } else {
                                req.flash('msg_cadastro_erro', 'Não foi possível atualizar, tente de novo mais tarde.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            }
                        } else {
                            // cria um usuario
                            usuarioBanco = await Usuario.create({
                                nome: uNome,
                                telefone: uTelefone,
                                email: uEmail,
                                senha: uSenha,
                                privilegioId: uPrivilegioId,
                                tokenFirebase: "vazio"
                            });

                            if (usuarioBanco) {
                                if (
                                    ConfiguracaoUsuario.create({
                                        valorMax: 30,
                                        valorMin: 20,
                                        emailAlerta: "vazio",
                                        telefoneAlerta: "vazio",
                                        switch_alerta: true,
                                        switch_email: false,
                                        switch_whatsapp: false,
                                        switch_sms: false,
                                        switch_telefone: false,
                                        switch_login: false,
                                        usuarioId: usuarioBanco.id
                                    })) {
                                    req.flash('msg_cadastro', 'Conta criada com sucesso.');
                                    req.session.save(function (err) {
                                        res.redirect('/cadastro/usuario');
                                    });
                                } else {
                                    req.flash('msg_cadastro_erro', 'Não foi possível salvar, tente de novo mais tarde.');
                                    req.session.save(function (err) {
                                        res.redirect('/cadastro/usuario');
                                    });
                                }

                            } else {
                                req.flash('msg_cadastro_erro', 'Não foi possível salvar, tente de novo mais tarde.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            }
                        }
                        break;
                    case 2://adm 

                        if (id) {
                            usuarioBanco = await Usuario.findOne({ where: { id: id } });
                            usuarioBanco.nome = uNome;
                            usuarioBanco.telefone = uTelefone;
                            usuarioBanco.email = uEmail;

                            if (uSenha)
                                usuarioBanco.senha = uSenha;

                            usuarioBanco.usuarioId = usuario.id;
                            usuarioBanco.privilegioId = uPrivilegioId;
                            usuarioBanco.tokenFirebase = "vazio";

                            if (usuarioBanco.save()) {

                                req.flash('msg_cadastro', 'Usuário atualizado com sucesso.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            } else {
                                req.flash('msg_cadastro_erro', 'Não foi possível atualizar, tente de novo mais tarde.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            }
                        } else {
                            // cria um usuario
                            usuarioBanco = await Usuario.create({
                                nome: uNome,
                                telefone: uTelefone,
                                email: uEmail,
                                senha: uSenha,
                                usuarioId: usuario.id,
                                privilegioId: uPrivilegioId,
                                tokenFirebase: "vazio"
                            });

                            if (usuarioBanco) {
                                if (
                                    ConfiguracaoUsuario.create({
                                        valorMax: 30,
                                        valorMin: 20,
                                        emailAlerta: "vazio",
                                        telefoneAlerta: "vazio",
                                        switch_alerta: true,
                                        switch_email: false,
                                        switch_whatsapp: false,
                                        switch_sms: false,
                                        switch_telefone: false,
                                        switch_login: false,
                                        usuarioId: usuario.id
                                    })) {

                                    visualizacao_usuario_usuario.create({
                                        donoId: usuario.id,
                                        usuarioId: usuarioBanco.id

                                    }).then(r => {
                                        req.flash('msg_cadastro', 'Conta criada com sucesso.');
                                        req.session.save(function (err) {
                                            res.redirect('/cadastro/usuario');
                                        });
                                    }).catch(e => {

                                        req.flash('msg_cadastro_erro', 'Não foi possível salvar, tente de novo mais tarde.');
                                        req.session.save(function (err) {
                                            res.redirect('/cadastro/usuario');
                                        });
                                    })
                                } else {
                                    req.flash('msg_cadastro_erro', 'Não foi possível salvar, tente de novo mais tarde.');
                                    req.session.save(function (err) {
                                        res.redirect('/cadastro/usuario');
                                    });
                                }
                            } else {
                                req.flash('msg_cadastro_erro', 'Não foi possível salvar, tente de novo mais tarde.');
                                req.session.save(function (err) {
                                    res.redirect('/cadastro/usuario');
                                });
                            }
                        }
                        break;
                }
            }//if valida
        }).catch(e => { console.log('erro banco:', e); });

    } catch (e) {
        console.log("erro cadastrar usuario", e);
    }
};
exports.postCadastroUsuarioRemover = (req, res, next) => {
    const usuarioId = req.body.dialogExcluirId.trim();

    ConfiguracaoUsuario.destroy({ where: { usuarioId: usuarioId } }).then(u => {
        Usuario.destroy({ where: { id: usuarioId } }).then(u => {

            visualizacao_usuario_usuario.destroy({
                where: { usuarioId: usuarioId }

            }).then(r => {
                req.flash('msg_cadastro_exclusao', 'Usuário excluído com sucesso');
                req.session.save(function (err) {
                    res.redirect('/cadastro/usuario');
                });
            }).catch(e => {
                req.flash('msg_cadastro_exclusao_erro', 'Não foi possível excluir o usuário.Tente de novo mais tarde.');
                req.session.save(function (err) {
                    res.redirect('/cadastro/usuario');
                });
            })


        }).catch(err => {
            req.flash('msg_cadastro_exclusao_erro', 'Não foi possível excluir o usuário.Tente de novo mais tarde.');
            req.session.save(function (err) {
                res.redirect('/cadastro/usuario');
            });
        });
    });
};

