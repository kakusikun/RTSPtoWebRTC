
let Status = {
    SUCCESS: 16,
    PROCESS: 17,
    CLEAN: 18,
}

let wsIp = null;

let blackList = {};

let currentCid = '';

let Render = {
    generalTitle: "Acer Inc. へようこそ",
    recognizeFaceTitle: "識別中",
    takeTemperatureTitle: "体温を測るため、動うごかないでください",
    canvas: null,
    ctx: null,
    image: null,
    validRegion: [145, 452, 935, 1465],
    validFaceWidth: 200,
    coordTitleProp: getCoordProp(0, 0, 1080, 138, 70),
    coordTempProp: getCoordProp(0, 150, 1080, 270, 95),
    coordIdProp: getCoordProp(0, 280, 1080, 355, 75),
    coordIdTitleProp: getCoordProp(0, 355, 1080, 400, 45),
    coordIdNoTitleProp: getCoordProp(0, 303, 1080, 378, 75),
    coordValidRegionProp: getCoordProp(145, 452, 935, 1465, 0),
    coordEffectProp: getCoordProp(0, 138, 1080, 400, 0),
    coordTitle: null,
    coordTemp: null,
    coordId: null,
    coordIdTitle: null,
    coordIdNoTitle: null,
    coordValidRegion: null,
    coordEffect: null,
};

function getCoordProp (px1, py1, px2, py2, th) {
    return {
        tl: {
            px: px1 / 1080.0,
            py: py1 / 1920.0,
        },
        br: {
            px: px2 / 1080.0,
            py: py2 / 1920.0,
        },
        textHeight: th / 1920.0
    }
}

function getCoordFromProp (w, h, Prop) {
    var coord = {
        tl: {
            x: parseInt( Prop.tl.px * w ),
            y: parseInt( Prop.tl.py * h ),
        },
        br: {
            x: parseInt( Prop.br.px * w ),
            y: parseInt( Prop.br.py * h ),
        },
        textHeight: parseInt( Prop.textHeight * h)
    };
    coord.w = coord.br.x - coord.tl.x;
    coord.h = coord.br.y - coord.tl.y;
    return coord
}

function initRender () {
    var canvas = document.createElement( "canvas" );
    var ctx = canvas.getContext("2d");
    var image = document.createElement( "img" );

    canvas.id = "video-canvas";
    Render.canvas = canvas;
    Render.ctx = ctx;
    image.id = "effect";
    image.src = "/static/green.svg";
    Render.image = image;

    $( "#remoteVideos" )[0].appendChild(image);
    $( "#remoteVideos" )[0].appendChild(canvas);

    resizeRender();

    $( "#main-stream" ).on( "play", () => {
        console.log( "played" );
        $( "#main-stream" ).css( "opacity", "1" );
        resizeRender();
        plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5, true);
    });
    
    $( window ).resize( () => {
        console.log( "resized" )
        resizeRender();
        plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5, true);
    });
}

function resizeRender () {
    var height =  window.innerHeight;
    var videoElt = $( "#main-stream" )[ 0 ];
    if ( videoElt !== null ) {
        if ( videoElt.videoHeight >= videoElt.videoWidth ) {
            var ratio = height / videoElt.videoHeight;
            videoElt.width = videoElt.videoWidth * ratio;
            videoElt.height = height;
            Render.canvas.width = videoElt.videoWidth * ratio;
            Render.canvas.height = height;
            Render.image.width = videoElt.videoWidth * ratio;
            Render.image.height = height;
        } else {
            var ratio = height / videoElt.videoWidth;
            videoElt.width = height;
            videoElt.height = videoElt.videoHeight * ratio;
            Render.canvas.width = videoElt.videoHeight * ratio;
            Render.canvas.height = height;
            Render.image.width = videoElt.videoHeight * ratio;
            Render.image.height = height;
            $( "#main-stream" ).css( "transform", `rotate(90deg) translate(0px, -${videoElt.height}px)` );
            $( "#main-stream" ).css( "transform-origin", "top left" );
        }
        Render.coordTitle = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordTitleProp);
        Render.coordTemp = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordTempProp);
        Render.coordId = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordIdProp);
        Render.coordIdTitle = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordIdTitleProp);
        Render.coordIdNoTitle = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordIdNoTitleProp);
        Render.coordValidRegion = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordValidRegionProp);
        Render.coordEffect = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordEffectProp);
    }
}

function plotMessage (data) {
    if ( Render.ctx !== null ) {
        var Face = data.face;
        if ( Face !== null ) {
            if ( checkRighteousFace( Face ) ) {
                Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
                var Temp = Face.temperature.toFixed(1);
                if ( Face.is_stayed ) {
                    currentCid = Face.cid;
                    if ( Temp < 0 ) {
                        plotText(Render.takeTemperatureTitle, Render.coordTitle, "green", true, 0.5);
                    } else {
                        plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
                        var Name = Face.name;
                        var Title = Face.titles;
                        if ( Temp <= 37.5 ) {
                            if ( Name === null ) {
                                Name = `ゲスト(${Face.cid.slice(0, 4)})`;
                                plotEffect( "orange", true );
                            } else {
                                plotEffect( "green", true );
                            }
                        } else {
                            if ( Name === null ) {
                                Name = `ゲスト(${Face.cid.slice(0, 4)})`;
                            }
                            plotEffect( "red", true );
                        }
                        plotText(Temp.toString(), Render.coordTemp, "white", false, 1.0);
                        if ( Title === null ) {
                            plotText(Name, Render.coordIdNoTitle, "white", false, 1.0);
                        } else {
                            plotText(Name, Render.coordId, "white", false, 1.0);
                            plotText(Title, Render.coordIdTitle, "white", false, 1.0);
                        }
                    }
                    plotFace( Face );
                } else {
                    plotText(Render.recognizeFaceTitle, Render.coordTitle, "green", true, 0.5);
                    plotEffect( "green", false );
                }
            }
        } else {
            Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
            plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
            plotEffect( "green", false );
            checkRighteousFace( Face );
        }
    }
}

function checkRighteousFace ( Face ) {
    var isRighteous = false;
    if ( Face !== null ) {
        if ( !blackList.includes( Face.cid ) ) {
            if ( Face.bbox[0] > Render.validRegion[0] && 
                 Face.bbox[2] < Render.validRegion[2] &&
                 Face.bbox[1] > Render.validRegion[1] &&
                 Face.bbox[3] < Render.validRegion[3] &&
                 ( Face.bbox[2] - Face.bbox[0] ) > Render.validFaceWidth ) {
                console.log( Face.bbox[2] - Face.bbox[0] );
                isRighteous = true;
            } else {
                if ( Face.is_stayed ) {
                    blackList[ Face.cid ] = true;
                    setTimeout( () => {
                        delete blackList[ Face.cid ];
                    }, 2000);
                }
            }
        } 
    } else {
        if ( !blackList.includes( currentCid ) ) {
            blackList[ Face.cid ] = true;
            setTimeout( () => {
                delete blackList[ Face.cid ];
            }, 2000);
        }
    }
    return isRighteous
}


function plotFace ( Face ) {
    var Bbox = Face.bbox;
    var Landmark = Face.landmark;
    var ratio = Render.canvas.height / 1920.0;
    var ctx = Render.ctx;
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'white';
    ctx.strokeRect( Bbox[0] * ratio, Bbox[1] * ratio, ( Bbox[2] - Bbox[0] ) * ratio, ( Bbox[3] - Bbox[1 ]) * ratio );
    Landmark.forEach(l => {
        ctx.beginPath();
        ctx.arc(l[0] * ratio, l[1] * ratio, 8, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    });
}

function plotText ( text, coord, level, background, alpha) {
    if ( Render.ctx !== null && coord !== null ) {
        var ctx = Render.ctx;
        if ( background ) {
            ctx.fillStyle = `rgba(0, 0, 0, ${ alpha })`;
            ctx.fillRect(
                coord.tl.x,
                coord.tl.y,
                coord.w,
                coord.h,
            );
        }
        
        if ( text !== null ) {
            ctx.font = "10px Noto Sans TC";
            var metric = ctx.measureText(text);
            var textScale = coord.textHeight / metric.actualBoundingBoxAscent;
    
            switch ( level ) {
                case "red":
                    ctx.fillStyle = "rgb(228, 41, 64)";
                    break;
                case "green":
                    ctx.fillStyle = "rgb(121, 175, 42)";
                    break;
                case "orange":
                    ctx.fillStyle = "rgb(255, 160, 4)";
                    break;
                default:
                    ctx.fillStyle = "rgb(255, 255, 255)";
                    break;

            }
    
            ctx.font = `bold ${ parseInt( 10 * textScale ) }px "Noto Sans TC"`;
            var yOffset = ctx.measureText(text).actualBoundingBoxAscent;
            ctx.textAlign = "center";
            ctx.fillText(
                text,
                ( coord.tl.x + coord.br.x ) / 2,
                ( coord.tl.y + coord.br.y + yOffset ) / 2,
            );
        }
    }
}

function plotEffect ( level, gradient ) {
    if ( Render.ctx !== null ) {
        var ctx = Render.ctx;
        var image = Render.image;
        var color = null;
        switch ( level ) {
            case "red":
                color = "228, 41, 64";
                image.src = "/static/red.svg";
                break;
            case "green":
                color = "121, 175, 42";
                image.src = "/static/green.svg";
                break;
            case "orange":
                color = "255, 160, 4";
                image.src = "/static/orange.svg";
                break;
            default:
                color = "255, 255, 255";
                break;
        }
        if ( gradient ) {
            var grd = ctx.createLinearGradient( 0, Render.coordEffect.br.y, 0, Render.coordEffect.tl.y );
            grd.addColorStop( 0.33, `rgba(${color}, 0.0)` );
            grd.addColorStop( 1.0, `rgba(${color}, 1.0)` );
            ctx.fillStyle = grd;
            ctx.fillRect( Render.coordEffect.tl.x, Render.coordEffect.tl.y, Render.coordEffect.w, Render.coordEffect.h );
        }
    }
}

function connectThoth () {
    try {
        var ws = new WebSocket("ws://127.0.0.1:8080/rollcall");
        ws.onopen = () => console.log("connected");
        ws.onclose = () => {
            setTimeout(() => {
                console.log("reconnect");
                connectThoth();
            }, 10000);            
            console.log("disconnected");
        }
        ws.onmessage = (msg) => {
            try {
                var data = JSON.parse(msg.data);
                plotMessage(data);
            } catch (e) {
                console.log(e);
            }
        }
        ws.onerror = (msg) => {
            console.log("error");
        }
    } catch (e) {
        alert("websocket is not connected");
    }
}

export { connectThoth, initRender };