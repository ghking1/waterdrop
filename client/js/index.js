
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

function showicon()
{
    ejs.renderFile('ejs/icon.ejs', null, null, callback);
    document.getElementById('clickbutton').onclick=showbanner;
} 

function showbanner()
{
    ejs.renderFile('ejs/banner.ejs', null, null, callback);
    document.getElementById('clickbutton').onclick=showsession;
} 

function showsession()
{
    function success(xhr)
    {
        var data = JSON.parse(xhr.responseText);
        ejs.renderFile('ejs/session.ejs', data, null, callback);
        document.getElementById('clickbutton').onclick=showicon;
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