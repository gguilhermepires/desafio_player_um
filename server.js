const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./util/database').sequelize;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const flash = require('connect-flash');
var session = require('express-session');
const util = require('./util/util');
/********************* models *************************** */

const Place = require('./models/Place');
const Usuario = require('./models/User');

/********************* rotas *************************** */
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

/*********************************************** */

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// *************** sessão
var SequelizeStore = require('connect-session-sequelize')(session.Store);

var ss = new SequelizeStore({
    db: sequelize
});
app.use(session({
    secret: 'keyboard cat',
    store: ss,
    saveUninitialized: false,
    resave: false, 
    proxy: true 
}));
ss.sync();

// ***************  flash msg   ***********************
app.use(flash());

/*****************************************************/
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/vote/:id', (req, res, next) => {
    var id = parseInt(req.params.id);
    Place.findOne({ where: { id: id } }).then(place => {

        if (place != undefined) {

            place.vote = place.vote + 1;

            place.save().then(() => {

                io.sockets.emit("vote", JSON.stringify(place));

                res.redirect("/");
            });

        } else {

            console.log("eeeo");

            res.redirect("/");
        }
    });
});

//************************* */

app.use(userRoutes);
app.use(adminRoutes);

io.on('connection', (socket) => {
 
    socket.on('send_vote', async function (req, callback) {

        var err = false;

        try {
            var obj = JSON.parse(req.data);

            var place = await Place.findOne({ where: { id: obj.id } });

            if (place != undefined) {

                place.vote = place.vote + 1;

                await place.save();

                io.sockets.emit("vote", JSON.stringify(place));
                callback({ ok: true, place: place });

            } else { err = true; }

        } catch (error) { err = true; }

        if (err) {
            callback({ error: true });
            return;
        }
    });


});

const reiniciaBanco = false;
sequelize.sync({ force: reiniciaBanco })
    .then(result => {
        Usuario.findOne({ where: { email: "gguilhermepires@gmail.com" } }).then(u => {
            if (u == undefined) {
                var sha256 = require('sha256');
                uSenha = sha256("admGui31");

                Usuario.create({
                    nome: "guilherme Pires",
                    email: "gguilhermepires@gmail.com",
                    password: uSenha,
                    privilegioId: 1,

                });
                uSenha = sha256("t");
                Usuario.create({
                    nome: "adm@gmail",
                    email: "adm@gmail.com",
                    password: uSenha,
                    privilegioId: 2,

                });
            }
        })
        console.log("\n\nDesafio - player um - porta:" + util.server_port);
    }).catch(e => {
        console.log("Erro banco:", e.toString());
    });

server.listen(util.server_port);
