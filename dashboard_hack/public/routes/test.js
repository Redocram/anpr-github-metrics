let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/:id', function (req, res, next) {
    res.render('test', {id: req.params.id})
});

router.post('/submit', function (req, res, next) {
    var id = req.body.id;
    res.redirect('/test/' + id);
});

module.exports = router;