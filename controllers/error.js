exports.get404 = (req, res, next) => { //MVC controller xử lý xong 404 error thì không next nữa
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '/404',
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.get500=(req,res,next)=>{  //MVC controller xử lý xong 500 error thì không next nữa
  res.status(500).render('500', {
    pageTitle: 'Server error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
}
