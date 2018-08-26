
var http=require('http');
var url=require('url');
var fs=require('fs');
var mime=require('mime');


/**************************************************
 *
 *  config
 *
 **************************************************/
SERVER_PORT   = 80;               //default use 80
SERVER_BIND   = '0.0.0.0';        //default accept all ip address
ROUTER_PATH   = './router';       //default use routers in './router'
STATIC_PATH   = '../client';      //default static files path
SESSION_TIMES = 10080;            //session expiration time (minute), default is one week
SESSION_SLICE = 60;               //recycle sessions every slice time (minute), default is one hour
PRINT_LOG     = true;             //whether print log information
BODY_LIMIT    = 1;//1024*1024*100;    //body size limit (Byte), 100M default


/**************************************************
 *
 *  middlewares and routers
 *
 **************************************************/
//middlewares is "router_string: [[catch_ware1, catch_ware2,...], [bubble_ware1, bubble_ware2,...]]" dictionary
var middlewares={
    '/': [[session_ware, query_ware, body_ware], [log_ware]]   //default middle ware, it can be removed
};

//routers is "router_string: router_handler" dictionary
var routers={
    '/': default_handler,               //request for root like http://example.com, default_handler will show index.html
    '/notfound': notfound_handler       //request notfound, notfound_handler will show 404.html
};


/**************************************************
 *
 *  main dispatcher
 *
 **************************************************/
if(ROUTER_PATH.slice(-1)=='/')  //if path end with '/', remove '/'
{
    ROUTER_PATH=ROUTER_PATH.slice(0, -1);
}
if(STATIC_PATH.slice(-1)=='/')  //if path end with '/', remove '/'
{
    STATIC_PATH=STATIC_PATH.slice(0, -1);
}

function main(req, res)
{
    var router_string=url.parse(req.url).pathname;
    if(router_string.slice(-1)=='/' && router_string.length>1)  //if path end with '/', remove '/', but not root
    {
       router_string=router_string.slice(0, -1);
    }

    var path_array = router_string.split('/');  //root request '/' result is ['', ''], so the last '' need be removed
    if(path_array[path_array.length-1]==''){path_array.pop()}

    //execute one by one, use next to switch
    var execute_1by1 = [];
    var execute_index = 0;

    //catch stage
    var catch_string = '';
    path_array.forEach(function(item, index, array){
        catch_string    = catch_string + '/' + item;
        if(typeof(middlewares[catch_string]) != 'undefined')
        {
            execute_1by1=execute_1by1.concat(middlewares[catch_string][0]);
        }
    });

    //object stage
    function route_wrap(req, res, next)
    {
        if(typeof(routers[router_string])=='function')      //find valid router, then dispatch to router_handler
        {
            routers[router_string].call(null, req, res, next);
        }
        else                                                //else handle it with staticFile 
        {
            staticFile(req, res, next, STATIC_PATH + router_string, false);
        }
    }
    execute_1by1.push(route_wrap);

    //bubble stage
    var bubble_string = router_string;
    path_array.reverse().forEach(function(item, index, array){
        if(typeof(middlewares[bubble_string]) != 'undefined')
        {
            execute_1by1=execute_1by1.concat(middlewares[bubble_string][1]);
        }
        bubble_string = (index==array.length-2) ? '/' : bubble_string.slice(0, -(('/'+item).length));
    });

    //next dispatcher, call execute_1by1's element in order
    function next()
    {
        if(execute_index<execute_1by1.length)
        {
            execute_1by1[execute_index++].call(null, req, res, next);
            //execute_index+1 shouldn't do after call, because it's recursive call
        }
    }
    next(); //start dispatch
}


/**************************************************
 *
 *  static file
 *
 *  notfound should be setted to true when 
 *  call it from notfound_handler
 *
 **************************************************/
function staticFile(req, res, next, file_path, notfound)
{
    fs.exists(file_path, handleExists);

    function handleExists(exists)
    {
        if(exists)
        {
            fs.readFile(file_path, 'binary', handleRead);
        }
        else if(notfound==true)         //if called from notfound_handler       !!!
        {                               //it means 404.html page cann't found   !!!
            res.writeHead(404);         //so response 404 directly              !!!
            res.write('404 error!');    //it shouldn't call notfound_handler    !!!
            res.end();                  //otherwise it will recusive forever    !!!
            next();
        }
        else if(typeof(routers['/notfound'])=='function')
        {
            routers['/notfound'].call(null, req, res, next);
        }
        else
        {
            res.writeHead(500);
            res.write('routers error!');
            res.end();
            next();
        }

        function handleRead(err, data)
        {
            if(err)
            {
                res.writeHead(500);
                res.write('IO error!');
                res.end();
            }
            else
            {
                res.writeHead(200, {'Content-Type': mime.getType(file_path)});
                res.write(data, 'binary');
                res.end();
            }
            next();
        }
    }
}

function default_handler(req, res, next)
{
    //when request for '/', but index.html is not exists
    //page won't response 404.html, but just response 404
    staticFile(req, res, next, STATIC_PATH + '/index.html', false);
}

function notfound_handler(req, res, next)
{
    var router_string=url.parse(req.url).pathname;
    if(router_string.slice(-5)=='.html')    //html notfound, response 404.html page
    {
        staticFile(req, res, next, STATIC_PATH + '/404.html', true);
    }
    else                                    //other file notfound, response 404 directly
    {
        res.writeHead(404);
        res.end();
        next();
    }
}


/**************************************************
 *
 *  client session
 *
 **************************************************/
var sessions={
    //session_id: {
    //    touch_time: time,
    //    session  : {...}    
    //}
}

//run it every SESSION_SLICE minute to clear overtime sessions
setInterval(function(){
    var now_time    = Date.now()
    var overtime    = SESSION_TIMES*60000;
    var keys        = Object.keys(sessions)
    var index       = 0;
    var end         = keys.length;
    for(/*none*/; index<end; ++index)
    {
        if(now_time-sessions[keys[index]].touch_time > overtime)
        {
            delete sessions[keys[index]];
        }
    }
}, SESSION_SLICE*60000);

function session_ware(req, res, next)
{
    var now_time = Date.now();
    var cookies = {};
    req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie, index, array){
        var parts = cookie.split('=');
        cookies[parts[0].trim()] = (parts[1] || '').trim();
    })

    var cookie = '';
    var session_id = cookies['session_id'];
    //get session according session_id
    if(session_id && sessions[session_id] && (now_time-sessions[session_id].touch_time)<=SESSION_TIMES*60000)
    {
        sessions[session_id].touch_time=now_time;
        req.session=sessions[session_id].session;
    }
    else //create new session bind to session_id, and set session_id as cookies to client
    {
        session_id = String(now_time) + String(Math.random()).slice(2);
        sessions[session_id]={touch_time: now_time, session:{}}
        cookie += 'session_id=' + session_id;
        cookie += ';Max-Age='   + String(SESSION_TIMES*60);
        cookie += ';path=/';
        cookie += ';httponly=true';
        res.setHeader("Set-Cookie", cookie);
        req.session=sessions[session_id].session;
    }
    next();
}


/**************************************************
 *
 *  receive raw body 
 *
 **************************************************/
function body_ware(req, res, next)
{
    if(req.method=='POST')
    {
        read_body(req, res, callback);
    }
    else
    {
        next();
    }

    function callback(status, body)
    {
        if(status.err)
        {
            req.body=null;  //todo: status should send to route
        }
        else
        {
            req.body = body;
        }
        next();
    }
}

function read_body(req, res, callback)
{
    var sync     = true;        //avoid cleanup so early
    var complete = false;       //avoid nonetheless option after done executed
    var buffer   = [];          //temp received buffer data, [buffer1, buffer2, ..., buffern]
    var received = 0;           //received length
    var content_length = parseInt(req.headers['content-length']);  //maybe NaN

    req.on('data', onData);
    req.on('close', cleanup);
    req.on('aborted', onAborted);
    req.on('end', onEnd);
    req.on('error', onEnd);

    sync = false;

    function done(status)  //0: success; -1: size exceed; -2: size inconformity; -3: abort unexpected
    {
        complete = true;
        sync ? process.nextTick(invokeCallback) : invokeCallback();

        function invokeCallback() 
        {
            cleanup();
            if (status.err) 
            {
                req.unpipe();   //detech all readable pipe
                buffer = null;  //free buffer
            }
            else
            {
                buffer=Buffer.concat(buffer); //merge buffer array to buffer
            }
            callback.call(null, status, buffer);
        }
    }

    function onData(data)
    {
        if(complete) return;
        received += data.length;
        if(received > BODY_LIMIT)
        {
            done({err:-1, msg:'size exceed'});
        }
        else
        {
            buffer.push(data);
        }
    }

    function onEnd(err)
    {
        if(complete) return;
        if(err || (content_length>=0 && content_length==buffer.length))
        {
            done({err:-2, msg:'size inconformity'});
        }
        else
        {
            done({err:0, msg:'success'});
        }
    }

    function onAborted()
    {
        if (complete) return;
        done({err:-3, msg:'abort unexpected'});
    }

    function cleanup () 
    {
        req.removeListener('data', onData);
        req.removeListener('close', cleanup);
        req.removeListener('aborted', onAborted);
        req.removeListener('end', onEnd);
        req.removeListener('error', onEnd);
    }
}


/**************************************************
 *
 *  other middle ware
 *
 **************************************************/
function log_ware(req, res, next)
{
    if(PRINT_LOG)
    {
        console.log('[info ]: request for ' + url.parse(req.url).pathname);
    }
    next();
}

function query_ware(req, res, next)
{
    req.query=url.parse(req.url, true).query;
    next();
}


/**************************************************
 *
 *  load routers recursively
 *
 **************************************************/
(function(){

   loadRouters(ROUTER_PATH);

   function loadRouters(router_path)
   {
      //if router_path is a directory, then call loadRouters for each of it's items
      if(fs.lstatSync(router_path).isDirectory())
      {  
         var items=fs.readdirSync(router_path); 
         items.forEach(function(item, index, array){
            loadRouters(router_path + '/' + item);
         });
      }
      //if router_path is js file, then load it as router
      else if(router_path.slice(-3) == '.js')
      {  
         var router_string = router_path.slice(ROUTER_PATH.length,-3);
         var router_handler = require(router_path); 
         if(typeof(router_handler)=='function')
         {
            routers[router_string] = router_handler;
         }
         else
         {
            console.log('[alert]: cann\'t load router ' + router_path)
         }
      }
      //it's neither a directory or js file
      else
      {  
         console.log('[alert]: router skip file ' + router_path)
      }
   }
})();


/**************************************************
 *
 *  start server
 *
 **************************************************/
http.createServer(main).listen(SERVER_PORT, SERVER_BIND);
console.log('[info ]: Server listening at http://' + SERVER_BIND + ':' + SERVER_PORT);