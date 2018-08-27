
module.exports=gethittimes;

function gethittimes(req, res, next)
{
    req.session.hittimes = req.session.hittimes ? ++req.session.hittimes : 1;
    res.send(JSON.stringify({hittimes: req.session.hittimes}));
    next();
}