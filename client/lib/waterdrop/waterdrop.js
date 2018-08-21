
/**************************************************
 *
 *  compatible ajax
 *
 **************************************************/
;function createXHR()
{
    if (typeof(XMLHttpRequest) != "undefined")
    {
        return new XMLHttpRequest();
    } 
    else if (typeof(ActiveXObject) != "undefined")
    {
        if (typeof(arguments.callee.activeXString) != "string")
        {
            var versions = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp"];
            var i, len;
            for (i=0,len=versions.length; i < len; i++)
            {
                try 
                {
                    new ActiveXObject(versions[i]);
                    arguments.callee.activeXString = versions[i];
                    break;
                } 
                catch (ex)
                {
                    //skip
                }
            }
        }
        return new ActiveXObject(arguments.callee.activeXString);
    } 
    else 
    {
        throw new Error("No XHR object available.");
    }
}

/**************************************************
 *
 *  content_type: only for post request
 *  timeout: request will be overtime after it (ms)
 *  cache  : only for get request 
 *  success: request success callback, with xhr parameter
 *  error  : request failed callback, with xhr parameter
 *
 **************************************************/
function AJAX(type, url, data, options)
{
    var content_type = (options && options.content_type) ? options.content_type : 'text/plain';
    var timeout      = (options && options.timeout)      ? options.timeout      : 30000;
    var cache        = (options && options.cache)        ? options.cache        : false;
    var success      = (options && options.success)      ? options.success      : function(){};
    var error        = (options && options.error)        ? options.error        : function(){};

    var xhr          = undefined;
    var ajax_timeout = undefined;  
    try
    {
        xhr = createXHR();
        ajax_timeout = window.setTimeout(function () {
            xhr.abort();
        }, timeout);

        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4)
            {
                window.clearTimeout(ajax_timeout);
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) 
                {
                    window.setTimeout(function(){
                      success(xhr);
                    }, 0);
                }
                else
                {
                    window.setTimeout(function(){
                        error(xhr);
                    }, 0);
                }
            }
        }

        if(type.toUpperCase() == "GET")
        {
            xhr.open(type, url, true);
            cache ? null : xhr.setRequestHeader("If-Modified-Since","0");
            xhr.send(null)
        } 
        else if(type.toUpperCase() == "POST")
        {
            xhr.open(type, url, true);
            xhr.setRequestHeader('Content-Type', content_type);
            xhr.send(data);
        }
    }
    catch(ex)
    {
        window.clearTimeout(ajax_timeout);
        error(xhr);
    }
}


/**************************************************
 *
 *  ejs renderFile client side patch
 *
 **************************************************/
(function()
{
    function renderFile(filename, data, options, callback)
    {
        function success(xhr)
        {
            var template = ejs.render(xhr.responseText, data, options);
            callback(template);
        }

        function error(xhr)
        {
            callback(null);
        }

        var template     = null;
        var ajax_options = null;
        var cache        = options && (options.cache ? options.cache : false);
        options && (options.cache ? (options.filename=filename) : null)
        //if filename is cached, then use cache when cache is true
        if(cache && typeof(ejs.cache.get(filename))=='function')
        {
            template = ejs.render(null, data, options);
            callback(template);
        }
        else //use ajax request filename
        {
            ajax_options = {
                success: success,
                error: error,
                cache: cache
            }
            AJAX('GET', filename, null, ajax_options);
        }
    }

    //ejs default renderFile can only work on server side!
    ejs.renderFile=renderFile;
})();


/**************************************************
 *
 *  xss filter
 *
 **************************************************/
function xssencode(str)
{
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function xssdecode(str)
{
    var div = document.createElement('div');
    div.innerHTML = str;
    return div.innerText || div.textContent;
}


/**************************************************
 *
 *  create element from string
 *
 **************************************************/
function create_element(str)
{
    var tmp_div=document.createElement('div');
    tmp_div.innerHTML=str;
    var element=tmp_div.firstChild;
    while(element!=null && element.nodeType!=1)
    {
        element=element.nextSibling;
    }
    return element;
}