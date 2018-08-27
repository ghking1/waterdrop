
module.exports=uploadfile;

var fs=require("fs");

function uploadfile(req, res, next)
{
    function writeHandle(err)
    {
        if(err)
        {
            res.send(JSON.stringify({err: -4, msg: 'cann\'t write'}));
        }
        else
        {
            res.send(JSON.stringify({err: 0, msg: 'success'}));
        }
        next();
    }

    if(req.body!=null)
    {
        fs.writeFile(req.query.filename, req.body, "binary", writeHandle);
    }
    else
    {
        res.send(JSON.stringify({err: -1, msg: 'size exceed'}));
    }
}