// test
function successHandler(d) { console.log('buy success',d) }
function failureHandler(d) { console.log('buy failure',d) }

function purchase() {
    google.payments.inapp.buy({
        parameters: {env:'prod'},
        'jwt':'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJhdWQiOiAiR29vZ2xlIiwgImlzcyI6ICIxMzcxNDI5MzY1OTA4OTU0NDU4MCIsICJyZXF1ZXN0IjogeyJjdXJyZW5jeUNvZGUiOiAiVVNEIiwgInByaWNlIjogIjEwLjAwIiwgInNlbGxlckRhdGEiOiAidXNlcl9pZDoxMjI0MjQ1LG9mZmVyX2NvZGU6MzA5ODU3Njk4NyxhZmZpbGlhdGU6YWtzZGZib3Z1OWoiLCAibmFtZSI6ICJQaWVjZSBvZiBDYWtlIiwgImRlc2NyaXB0aW9uIjogIlZpcnR1YWwgY2hvY29sYXRlIGNha2UgdG8gZmlsbCB5b3VyIHZpcnR1YWwgdHVtbXkifSwgImV4cCI6ICIxNDg5NjY1MDk0IiwgImlhdCI6ICIxMzg5NjY1MDk0IiwgInR5cCI6ICJnb29nbGUvcGF5bWVudHMvaW5hcHAvaXRlbS92MSJ9.k1NE7f8N7YA5blXJav96ezbFxYykjhi7p7q7wvjhv7s',
        'success' : successHandler,
        'failure' : failureHandler
    });
}

$(document).ready( function() {
    console.log('help page ready')
    // TODO - send analytics event
    //document.getElementById('sponsor').addEventListener('click', purchase)

    chrome.runtime.getBackgroundPage( function(bg) {
        var client = bg.session.client
        document.getElementById('version').innerText = client.version
        document.getElementById('user-agent').innerText = navigator.userAgent;
        document.getElementById('x-user-agent').innerText = client.getUserAgent();
        document.getElementById('peerid').innerText = client.peeridbytes_begin;

        var oauth = document.getElementById('oauthscope')
        var scopes = [

// "https://www.googleapis.com/auth/drive.appfolder",
                      "openid",
//                      "email",
//                      "profile",
//                      "https://www.googleapis.com/auth/drive.file"
            ]
        oauth.addEventListener('click',function() {
            
            chrome.identity.getAuthToken({scopes:scopes,
                                          interactive:true
                                         },
                                         function(result) {
                                             console.log('auth result',result)
                                         })
        })


        var elt = document.getElementById('bgpermission')
        elt.addEventListener('click',function() {
            chrome.permissions.request({permissions:['background']}, function(result) {
                console.log('bg permission result',result)
            })
        })

        
        if (! bg.session.userProfile.email) {
            var signup = document.getElementById('signup')
            document.getElementById('signup_div').style.display=''
            signup.addEventListener('click',function() {
                chrome.permissions.request({permissions:['identity.email']}, function(result) {
                    console.log('permission result',result)
                })
            })
        }
    })
})
