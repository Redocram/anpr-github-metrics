let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home page' });
});

router.get('/test/:id', function (req, res, next) {
   res.render('test', {id: req.params.id})
});



module.exports = router;

