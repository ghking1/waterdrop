
module.exports=gethittimes;

function gethittimes(req, res, next)
{
    req.session.hittimes = req.session.hittimes ? ++req.session.hittimes : 1;
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write(JSON.stringify({hittimes: req.session.hittimes}));
    res.end();
    next();
}