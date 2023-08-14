window.app={socket:null,console:{}};(function(global){global.logServer=function(log){if(window.ThisIsAMobileApp){window.postMobileError(log)}else if(global.socket&&global.socket instanceof WebSocket&&global.socket.readyState===1){global.socket.send(log)}else if(global.socket&&global.L&&global.app.definitions.Socket&&global.socket instanceof global.app.definitions.Socket&&global.socket.connected()){global.socket.sendMessage(log)}else{var req=new XMLHttpRequest;var url=global.location.protocol+"//"+global.location.host+global.location.pathname.match(/.*\//)+"logging.html";req.open("POST",url,true);req.setRequestHeader("Content-type","application/json; charset=utf-8");req.send(log)}};global.setLogging=function(doLogging){var loggingMethods=["error","warn","info","debug","trace","log","assert","time","timeEnd","group","groupEnd"];if(!doLogging){var noop=function(){};for(var i=0;i<loggingMethods.length;i++){window.app.console[loggingMethods[i]]=noop}}else{for(var i=0;i<loggingMethods.length;i++){if(!Object.prototype.hasOwnProperty.call(window.console,loggingMethods[i])){continue}(function(method){window.app.console[method]=function logWithCool(){var args=Array.prototype.slice.call(arguments);return window.console[method].apply(console,args)}})(loggingMethods[i])}window.onerror=function(msg,src,row,col,err){var data={userAgent:navigator.userAgent.toLowerCase(),vendor:navigator.vendor.toLowerCase(),message:msg,source:src,line:row,column:col};var desc=err?err.message||"(no message)":"(no err)",stack=err?err.stack||"(no stack)":"(no err)";var log="jserror "+JSON.stringify(data,null,2)+"\n"+desc+"\n"+stack+"\n";global.logServer(log);return false}}};global.setLogging(global.coolLogging=="true");global.getParameterByName=function(name){name=name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var regex=new RegExp("[\\?&]"+name+"=([^&#]*)");var results=regex.exec(location.search);return results===null?"":results[1].replace(/\+/g," ")};var ua=navigator.userAgent.toLowerCase(),uv=navigator.vendor.toLowerCase(),doc=document.documentElement,ie="ActiveXObject"in window,webkit=ua.indexOf("webkit")!==-1,phantomjs=ua.indexOf("phantom")!==-1,android23=ua.search("android [23]")!==-1,chrome=ua.indexOf("chrome")!==-1,gecko=ua.indexOf("gecko")!==-1&&!webkit&&!window.opera&&!ie,safari=!chrome&&(ua.indexOf("safari")!==-1||uv.indexOf("apple")==0),win=navigator.platform.indexOf("Win")===0,mobile=typeof orientation!=="undefined"||ua.indexOf("mobile")!==-1,cypressTest=ua.indexOf("cypress")!==-1,msPointer=!window.PointerEvent&&window.MSPointerEvent,pointer=window.PointerEvent&&navigator.pointerEnabled&&navigator.maxTouchPoints||msPointer,ie3d=ie&&"transition"in doc.style,webkit3d="WebKitCSSMatrix"in window&&"m11"in new window.WebKitCSSMatrix&&!android23,gecko3d="MozPerspective"in doc.style,opera12="OTransition"in doc.style;var chromebook=window.ThisIsTheAndroidApp&&window.COOLMessageHandler.isChromeOS();var touch=!window.L_NO_TOUCH&&(pointer||"ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch)&&!chromebook;var isInternetExplorer=navigator.userAgent.toLowerCase().indexOf("msie")!=-1||navigator.userAgent.toLowerCase().indexOf("trident")!=-1;global.L={};global.L.Params={closeButtonEnabled:global.getParameterByName("closebutton"),revHistoryEnabled:global.getParameterByName("revisionhistory")};global.L.Browser={ie:ie,ielt9:ie&&!document.addEventListener,edge:"msLaunchUri"in navigator&&!("documentMode"in document),webkit:webkit,gecko:gecko,android:ua.indexOf("android")!==-1,android23:android23,chrome:chrome,safari:safari,win:win,ie3d:ie3d,isInternetExplorer:isInternetExplorer,webkit3d:webkit3d,gecko3d:gecko3d,opera12:opera12,any3d:!window.L_DISABLE_3D&&(ie3d||webkit3d||gecko3d)&&!opera12&&!phantomjs,mobile:mobile,mobileWebkit:mobile&&webkit,mobileWebkit3d:mobile&&webkit3d,mobileOpera:mobile&&window.opera,mobileGecko:mobile&&gecko,cypressTest:cypressTest,touch:!!touch,msPointer:!!msPointer,pointer:!!pointer,retina:(window.devicePixelRatio||window.screen.deviceXDPI/window.screen.logicalXDPI)>1};global.mode={isChromebook:function(){return chromebook},isMobile:function(){if(global.mode.isChromebook())return false;if(global.L.Browser.mobile&&L.Browser.cypressTest){return true}return L.Browser.mobile&&(screen.width<768||screen.height<768)},isTablet:function(){if(global.mode.isChromebook())return false;return L.Browser.mobile&&!window.mode.isMobile()},isDesktop:function(){if(global.mode.isChromebook())return true;return!L.Browser.mobile},getDeviceFormFactor:function(){if(window.mode.isMobile())return"mobile";else if(window.mode.isTablet())return"tablet";else if(window.mode.isDesktop())return"desktop";else return null}};global.deviceFormFactor=window.mode.getDeviceFormFactor();document.addEventListener("contextmenu",function(e){if(e.preventDefault){e.preventDefault()}else{e.returnValue=false}},false);global.fakeWebSocketCounter=0;global.FakeWebSocket=function(){this.binaryType="arraybuffer";this.bufferedAmount=0;this.extensions="";this.protocol="";this.readyState=1;this.id=window.fakeWebSocketCounter++;this.sendCounter=0;this.onclose=function(){};this.onerror=function(){};this.onmessage=function(){};this.onopen=function(){};this.close=function(){}};global.FakeWebSocket.prototype.send=function(data){this.sendCounter++;window.postMobileMessage(data)};global.proxySocketCounter=0;global.ProxySocket=function(uri){var that=this;this.uri=uri;this.binaryType="arraybuffer";this.bufferedAmount=0;this.extensions="";this.unloading=false;this.protocol="";this.connected=true;this.readyState=0;this.sessionId="open";this.id=window.proxySocketCounter++;this.sendCounter=0;this.msgInflight=0;this.openInflight=0;this.inSerial=0;this.outSerial=0;this.minPollMs=25;this.maxPollMs=500;this.curPollMs=this.minPollMs;this.minIdlePollsToThrottle=3;this.throttleFactor=1.15;this.lastDataTimestamp=performance.now();this.onclose=function(){};this.onerror=function(){};this.onmessage=function(){};this.decoder=new TextDecoder;this.doSlice=function(bytes,start,end){return bytes.slice(start,end)};this.decode=function(bytes,start,end){return this.decoder.decode(this.doSlice(bytes,start,end))};this.parseIncomingArray=function(arr){for(var i=0;i<arr.length;++i){var left=arr.length-i;if(left<4){break}var type=String.fromCharCode(arr[i+0]);if(type!="T"&&type!="B"){window.app.console.debug("wrong data type: "+type);break}i++;if(arr[i]!==48&&arr[i+1]!==120){window.app.console.debug("missing hex preamble");break}i+=2;var numStr="";var start=i;while(arr[i]!=10)i++;numStr=this.decode(arr,start,i);var serial=parseInt(numStr,16);i++;if(arr[i]!==48&&arr[i+1]!==120){window.app.console.debug("missing hex preamble");break}i+=2;start=i;while(arr[i]!=10)i++;numStr=this.decode(arr,start,i);var size=parseInt(numStr,16);i++;var data;if(type=="T")data=this.decode(arr,i,i+size);else data=this.doSlice(arr,i,i+size);if(serial!==that.inSerial+1){window.app.console.debug("Error: serial mismatch "+serial+" vs. "+(that.inSerial+1))}that.inSerial=serial;this.onmessage({data:data});i+=size}};this.sendQueue="";this._signalErrorClose=function(){clearInterval(this.pollInterval);clearTimeout(this.delaySession);this.pollInterval=undefined;this.delaySession=undefined;if(that.readyState<3){this.onerror();this.onclose()}this.sessionId="open";this.inSerial=0;this.outSerial=0;this.msgInflight=0;this.openInflight=0;this.readyState=3};this._setPollInterval=function(intervalMs){clearInterval(this.pollInterval);if(this.readyState===1)this.pollInterval=setInterval(this.doSend,intervalMs)},this.doSend=function(){if(that.sessionId==="open"){if(that.readyState===3)window.app.console.debug("Error: sending on closed socket");return}if(that.msgInflight>=4){if(that.curPollMs<that.maxPollMs){that.curPollMs=Math.min(that.maxPollMs,that.curPollMs*that.throttleFactor)|0;window.app.console.debug("High latency connection - too much in-flight, throttling to "+that.curPollMs+" ms.");that._setPollInterval(that.curPollMs)}else if(performance.now()-that.lastDataTimestamp>30*1e3){window.app.console.debug("Close connection after no response for 30secs");that._signalErrorClose()}else window.app.console.debug("High latency connection - too much in-flight, pausing.");return}that._setPollInterval(that.maxPollMs);var req=new XMLHttpRequest;req.open("POST",that.getEndPoint("write"));req.responseType="arraybuffer";req.addEventListener("load",function(){if(this.status==200){var data=new Uint8Array(this.response);if(data.length){that.curPollMs=that.minPollMs;that._setPollInterval(that.curPollMs);that.lastDataTimestamp=performance.now();that.parseIncomingArray(data);return}}else{window.app.console.debug("proxy: error on incoming response "+this.status);that._signalErrorClose()}if(that.curPollMs<that.maxPollMs){var timeSinceLastDataMs=performance.now()-that.lastDataTimestamp|0;if(timeSinceLastDataMs>=that.minIdlePollsToThrottle*that.curPollMs){that.curPollMs=Math.min(that.maxPollMs,that.curPollMs*that.throttleFactor)|0}}that._setPollInterval(that.curPollMs)});req.addEventListener("loadend",function(){that.msgInflight--});req.send(that.sendQueue);that.sendQueue="";that.msgInflight++};this.getSessionId=function(){if(this.openInflight>0){window.app.console.debug("Waiting for session open");return}if(this.delaySession)return;if(global.lastCreatedProxySocket){var msSince=performance.now()-global.lastCreatedProxySocket;if(msSince<250){var delay=250-msSince;window.app.console.debug("Wait to re-try session creation for "+delay+"ms");this.curPollMs=delay;this.delaySession=setTimeout(function(){that.delaySession=undefined;that.getSessionId()},delay);return}}global.lastCreatedProxySocket=performance.now();var req=new XMLHttpRequest;req.open("POST",that.getEndPoint("open"));req.responseType="text";req.addEventListener("load",function(){window.app.console.debug("got session: "+this.responseText);if(this.status!==200||!this.responseText||this.responseText.indexOf("\n")>=0){window.app.console.debug("Error: failed to fetch session id! error: "+this.status);that._signalErrorClose()}else{that.sessionId=this.responseText;that.readyState=1;that.onopen();that._setPollInterval(that.curPollMs)}});req.addEventListener("loadend",function(){window.app.console.debug("Open completed state: "+that.readyState);that.openInflight--});req.send("");this.openInflight++};this.send=function(msg){var hadData=this.sendQueue.length>0;this.sendQueue=this.sendQueue.concat("B0x"+this.outSerial.toString(16)+"\n"+"0x"+msg.length.toString(16)+"\n"+msg+"\n");this.outSerial++;if(that.curPollMs>that.minPollMs||!hadData){if(that.msgInflight<=3){that.curPollMs=that.minPollMs;that._setPollInterval(that.curPollMs)}}};this.sendCloseMsg=function(beacon){var url=that.getEndPoint("close");if(!beacon){var req=new XMLHttpRequest;req.open("POST",url);req.send("")}else navigator.sendBeacon(url,"")};this.close=function(){var oldState=this.readyState;window.app.console.debug("proxy: close socket");this.readyState=3;this.onclose();clearInterval(this.pollInterval);clearTimeout(this.delaySession);this.pollInterval=undefined;if(oldState===1)this.sendCloseMsg(this.unloading);this.sessionId="open"};this.setUnloading=function(){this.unloading=true};this.getEndPoint=function(command){var base=this.uri;return base+"/"+this.sessionId+"/"+command+"/"+this.outSerial};window.app.console.debug("proxy: new socket "+this.id+" "+this.uri);this.getSessionId()};if(global.socketProxy){window.addEventListener("load",function(){var replaceUrls=function(rules,replaceBase){if(!rules)return;for(var r=0;r<rules.length;++r){if(rules[r]&&rules[r].type!=1){replaceUrls(rules[r].cssRules||rules[r].rules,replaceBase);continue}if(!rules[r]||!rules[r].style)continue;var img=rules[r].style.backgroundImage;if(img===""||img===undefined)continue;if(img.startsWith('url("images/')){rules[r].style.backgroundImage=img.replace('url("images/',replaceBase)}}};var sheets=document.styleSheets;for(var i=0;i<sheets.length;++i){var relBases=sheets[i].href.split("/");relBases.pop();var replaceBase='url("'+relBases.join("/")+"/images/";var rules;try{rules=sheets[i].cssRules||sheets[i].rules}catch(err){window.app.console.log("Missing CSS from "+sheets[i].href);continue}replaceUrls(rules,replaceBase)}},false)}global.createWebSocket=function(uri){if("processCoolUrl"in window){uri=window.processCoolUrl({url:uri,type:"ws"})}if(global.socketProxy){window.socketProxy=true;return new global.ProxySocket(uri)}else{return new WebSocket(uri)}};global._=function(string){if(window.ThisIsAMobileApp){if(window.LOCALIZATIONS&&Object.prototype.hasOwnProperty.call(window.LOCALIZATIONS,string)){var result=window.LOCALIZATIONS[string];if(window.LANG==="de-CH"){result=result.replace(/ß/g,"ss")}return result}else{return string}}else{return string.toLocaleString()}};if(global.webserver===undefined){var protocol=window.location.protocol==="file:"?"https:":window.location.protocol;global.webserver=global.host.replace(/^(ws|wss):/i,protocol);global.webserver=global.webserver.replace(/\/*$/,"")}var docParams,wopiParams;var filePath=global.getParameterByName("file_path");global.wopiSrc=global.getParameterByName("WOPISrc");if(global.wopiSrc!=""){global.docURL=decodeURIComponent(global.wopiSrc);if(global.accessToken!==""){wopiParams={access_token:global.accessToken,access_token_ttl:global.accessTokenTTL}}else if(global.accessHeader!==""){wopiParams={access_header:global.accessHeader}}if(wopiParams){docParams=Object.keys(wopiParams).map(function(key){return encodeURIComponent(key)+"="+encodeURIComponent(wopiParams[key])}).join("&")}}else{global.docURL=filePath}global.makeWsUrl=function(path){window.app.console.assert(global.host.startsWith("ws"),"host is not ws: "+global.host);return global.host+global.serviceRoot+path};global.makeDocAndWopiSrcUrl=function(root,docUrlParams,suffix,wopiSrcParam){var wopiSrc="";if(global.wopiSrc!=""){wopiSrc="?WOPISrc="+global.wopiSrc+"&compat=";if(wopiSrcParam&&wopiSrcParam.length>0)wopiSrc+="&"+wopiSrcParam}else if(wopiSrcParam&&wopiSrcParam.length>0){wopiSrc="?"+wopiSrcParam}suffix=suffix||"/ws";var encodedDocUrl=encodeURIComponent(docUrlParams)+suffix+wopiSrc;if(global.hexifyUrl)encodedDocUrl=global.hexEncode(encodedDocUrl);return root+encodedDocUrl+"/ws"};global.makeWsUrlWopiSrc=function(path,docUrlParams,suffix,wopiSrcParam){var websocketURI=global.makeWsUrl(path);return global.makeDocAndWopiSrcUrl(websocketURI,docUrlParams,suffix,wopiSrcParam)};global.makeHttpUrl=function(path){window.app.console.assert(global.webserver.startsWith("http"),"webserver is not http: "+global.webserver);return global.webserver+global.serviceRoot+path};global.makeHttpUrlWopiSrc=function(path,docUrlParams,suffix,wopiSrcParam){var httpURI=window.makeHttpUrl(path);return global.makeDocAndWopiSrcUrl(httpURI,docUrlParams,suffix,wopiSrcParam)};global.hexEncode=function(string){var bytes=(new TextEncoder).encode(string);var hex="0x";for(var i=0;i<bytes.length;++i){hex+=bytes[i].toString(16)}return hex};global.hexDecode=function(hex){if(hex.startsWith("0x"))hex=hex.substr(2);var bytes=new Uint8Array(hex.length/2);for(var i=0;i<bytes.length;i++){bytes[i]=parseInt(hex.substr(i*2,2),16)}return(new TextDecoder).decode(bytes)};if(window.ThisIsAMobileApp){global.socket=new global.FakeWebSocket;window.TheFakeWebSocket=global.socket}else{var docParamsPart=docParams?(global.docURL.includes("?")?"&":"?")+docParams:"";var websocketURI=global.makeWsUrlWopiSrc("/cool/",global.docURL+docParamsPart);try{global.socket=global.createWebSocket(websocketURI)}catch(err){window.app.console.log(err)}}var lang=encodeURIComponent(global.getParameterByName("lang"));global.queueMsg=[];if(window.ThisIsAMobileApp)window.LANG=lang;if(global.socket&&global.socket.readyState!==3){global.socket.onopen=function(){if(global.socket.readyState===1){var ProtocolVersionNumber="0.1";var timestamp=encodeURIComponent(global.getParameterByName("timestamp"));var msg="load url="+encodeURIComponent(global.docURL);var now0=Date.now();var now1=performance.now();var now2=Date.now();global.socket.send("coolclient "+ProtocolVersionNumber+" "+(now0+now2)/2+" "+now1);if(window.ThisIsAMobileApp){msg+=" lang="+window.LANG}else{if(timestamp){msg+=" timestamp="+timestamp}if(lang){msg+=" lang="+lang}}if(window.deviceFormFactor){msg+=" deviceFormFactor="+window.deviceFormFactor}if(window.isLocalStorageAllowed){var spellOnline=window.localStorage.getItem("SpellOnline");if(spellOnline){msg+=" spellOnline="+spellOnline}}global.socket.send(msg)}};global.socket.onerror=function(event){window.app.console.log(event)};global.socket.onclose=function(event){window.app.console.log(event)};global.socket.onmessage=function(event){if(typeof global.socket._onMessage==="function"){global.socket._emptyQueue();global.socket._onMessage(event)}else{global.queueMsg.push(event.data)}};global.socket.binaryType="arraybuffer";if(window.ThisIsAMobileApp){window.postMobileMessage("HULLO");this.socket.onopen()}}})(window);