function toggle_menu()
{
    var menu=document.querySelector(".nav .menu");

    if(menu.classList.contains("menu-toggle-block"))
    {
        menu.classList.remove("menu-toggle-block");   
    }
    else
    {
        menu.classList.add("menu-toggle-block");   
    }
}

function open_popup()
{
    var popup=document.querySelector("#popup");

    if(popup.classList.contains("wd-dn"))
    {
        popup.classList.remove("wd-dn");   
    }
}

function close_popup()
{
    var popup=document.querySelector("#popup");

    if(!popup.classList.contains("wd-dn"))
    {
        popup.classList.add("wd-dn");   
    }
}

window.addEventListener("load", function() {
    //onload 
});


