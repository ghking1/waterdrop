
//demo common function
function callback(template)
{
    if(template!=null)
    {
        document.getElementById('changeable').innerHTML=template;
    }
    else
    {
        alert('you may need start the server first!')
    }
}

var demos=[showicon, showbanner, showsession, showupload];
var current_index=0;
function shownext()
{
    demos[current_index].call(null);
    current_index = (current_index+1)%(demos.length);
}
shownext();  //show first demo when init

//simple demo
function showicon()
{
    ejs.renderFile('ejs/icon.ejs', null, null, callback);
} 

function showbanner()
{
    ejs.renderFile('ejs/banner.ejs', null, null, callback);
} 

//session demo
function showsession()
{
    function success(xhr)
    {
        var data = JSON.parse(xhr.responseText);
        ejs.renderFile('ejs/session.ejs', data, null, callback);
    }

    function error(xhr)
    {
        callback(null);
    }

    var url     = '/gethittimes';
    var data    = {name: 'ghking', age: '18'};
    var options = {
        success: success,
        error: error
    }
    AJAX('POST', url, JSON.stringify(data), options);
}

//upload demo
function showupload()
{
    ejs.renderFile('ejs/upload.ejs', null, null, callback);
} 

function uploadFile(files)
{
    if(files.length>0)
    {
        var reader = new FileReader();
        reader.onload = upload;
        reader.readAsArrayBuffer(files[0]);
        //recreate input element to avoid choose the same file cann't upload problem
        ejs.renderFile('ejs/upload.ejs', null, null, callback);
    }

    function upload(event)
    {
        var url     = '/uploadfile?filename='+files[0].name;
        var data    = event.target.result;
        var options = {
            success: success,
            error: error,
            content_type: 'application/octet-stream'
        }
        AJAX('POST', encodeURI(url), data, options);
    }

    function success(xhr)
    {
        var data = JSON.parse(xhr.responseText);
        if(data.err)
        {
            alert('failed! it may be size exceed.');
        }
        else
        {
            alert('success! see it in server directory.');
        }
    }

    function error(xhr)
    {
        alert('you may need start the server first!')
    }
}

