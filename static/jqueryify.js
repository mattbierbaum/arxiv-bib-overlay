javascript:(
    function(){
        var el=document.createElement("div");
        var b=document.getElementsByTagName("body")[0];
        var otherlib=!1;
        var msg="";
        el.style.position="fixed";
        el.style.height="32px";
        el.style.width="220px";
        el.style.marginLeft="-110px";
        el.style.top="0";
        el.style.left="50%";
        el.style.padding="5px 10px";
        el.style.zIndex=1001;
        el.style.fontSize="12px";
        el.style.color="#222";
        el.style.backgroundColor="#f99";
        function showMsg(){
            var txt=document.createTextNode(msg);
            el.appendChild(txt);
            b.appendChild(el);
            window.setTimeout(function(){
                txt=null;
                typeof jQuery=="undefined"?b.removeChild(el):(jQuery(el).fadeOut("slow",function(){jQuery(this).remove()}),otherlib&&(window.$jq=jQuery.noConflict()))
            },2500)
        }
        
        if (typeof jQuery!="undefined")
            return msg="This page already using jQuery v" jQuery.fn.jquery,showMsg();
            typeof $=="function"&&(otherlib=!0);
            function getScript(url,success){
                var script=document.createElement("script");
                script.src=url;
                var head=document.getElementsByTagName("head")[0];
                done=!1;
                script.onload=script.onreadystatechange=function(){
                    !done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")&&(done=!0,success(),script.onload=script.onreadystatechange=null,head.removeChild(script))
                };
                head.appendChild(script)
            }
            getScript("//code.jquery.com/jquery.min.js",function(){
                return typeof jQuery=="undefined"?msg="Sorry, but jQuery was not able to load":(msg="This page is now jQuerified with v" jQuery.fn.jquery,otherlib&&(msg =" and noConflict(). Use $jq(), not $().")),showMsg()
            })
    })();
