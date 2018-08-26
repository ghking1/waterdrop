
module.exports=uploadfile;

var fs=require("fs");

function uploadfile(req, res, next)
{
    function writeHandle(err)
    {
        if(err)
        {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write(JSON.stringify({err: -4, msg: 'cann\'t write'}));
            res.end();
        }
        else
        {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write(JSON.stringify({err: 0, msg: 'success'}));
            res.end();
        }
        next();
    }

    if(req.body!=null)
    {
        fs.writeFile(req.query.filename, req.body, "binary", writeHandle);
    }
    else
    {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write(JSON.stringify({err: -1, msg: 'size exceed'}));
        res.end();
    }
}