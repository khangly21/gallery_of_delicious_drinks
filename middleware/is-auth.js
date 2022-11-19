module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {  //vì sao không dùng req.session.user (ok) hay req.user??
        return res.redirect('/login');
    }
    next();
}

//https://expressjs.com/en/resources/middleware/session.html