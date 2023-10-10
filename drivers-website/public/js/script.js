function changeActionFromLoginPage(newAction){
    console.log(newAction)
    const form = document.getElementById("loginForm");
    switch(newAction){
        case "/login":
            form.action = "/login";
            form.method = "post";
            break;
        case "/register":
            form.action = "/register";
            form.method = "get";
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input=>{
                input.removeAttribute('required');
            })
            break;
    }
}


function changeActionFromRegisterPage(newAction){
    const form = document.getElementById("registerForm");
    switch(newAction){
        case "/login":
            form.action = "/login";
            form.method = "get";
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input=> {
                input.removeAttribute('required');
            });
            break;
        case "/register":
            form.action = "/register";
            form.method = "post";
            break;
    }
}