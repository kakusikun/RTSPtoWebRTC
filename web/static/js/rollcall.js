
let Status = {
    SUCCESS: 16,
    PROCESS: 17,
    CLEAN: 18,
}

let isCleanCount = 0;

let Render = {
    generalTitle: "Acer Inc. へようこそ",
    recognizeFaceTitle: "識別中",
    canvas: null,
    ctx: null,
    image: null,
    coordTitleProp: getCoordProp(0, 0, 1080, 138, 70),
    coordTempProp: getCoordProp(0, 150, 1080, 270, 95),
    coordIdProp: getCoordProp(0, 280, 1080, 355, 75),
    coordIdTitleProp: getCoordProp(0, 355, 1080, 400, 45),
    coordValidRegionProp: getCoordProp(145, 452, 935, 1465, 0),
    coordEffectProp: getCoordProp(0, 138, 1080, 400, 0),
    coordTitle: null,
    coordTemp: null,
    coordId: null,
    coordIdTitle: null,
    coordValidRegion: null,
    coordEffect: null,
};

let log = msg => { console.log(msg); }

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
        if ( videoElt.videoHeight > videoElt.videoWidth ) {
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
        Render.coordValidRegion = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordValidRegionProp);
        Render.coordEffect = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordEffectProp);
    }
}

function plotMessage (data) {
    if ( Render.ctx !== null ) {
        var Face = data.face;
        if ( Face !== null ) {
            Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
            if ( Face.is_stayed ) {
                plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
                var Temp = Face.temperature.toFixed(1);
                var Name = Face.name;
                var Bbox = Face.bbox;
                if ( Temp <= 37.5 ) {
                    if ( Name === null ) {
                        Name = "ゲスト";
                        plotEffect( "orange", true );
                    } else {
                        plotEffect( "green", true );
                    }
                } else {
                    if ( Name === null ) {
                        Name = "ゲスト";
                    }
                    plotEffect( "red", true );
                }
                plotText(Temp.toString(), Render.coordTemp, "white", false, 1.0);
                plotText(Name, Render.coordId, "white", false, 1.0);
                plotBbox(Bbox);
            } else {
                plotText(Render.recognizeFaceTitle, Render.coordTitle, "green", true, 0.5);
                plotEffect( "green", false );
            }
            isCleanCount = 0;
        } else if ( isCleanCount === 3 ) {
            Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
            plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
            plotEffect( "green", false );
            isCleanCount += 1;
        } else if ( isCleanCount < 4 ) {
            isCleanCount += 1;
        }
    }
}
// function plotMessage (data) {
//     if ( Render.ctx !== null ) {
//         switch (data.status) {
//             case Status.SUCCESS:
//                 if ( data.face.update_duration <= 30 ) {
//                     Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
//                     if ( data.face.is_stayed ) {
//                         plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
//                         var temp = data.face.temperature.toFixed(1);
//                         var name = null;
//                         if ( data.face.employee_id !== null ) {
//                             name = data.face.name;
//                         }                 
//                         if ( temp <= 37.5 ) {
//                             if ( name === null ) {
//                                 name = "ゲスト";
//                                 plotEffect( "orange" );
//                             } else {
//                                 plotEffect( "green" );
//                             }
//                         } else {
//                             if ( name === null ) {
//                                 name = "ゲスト";
//                             }
//                             plotEffect( "red" );
//                         }
//                         plotText(temp.toString(), Render.coordTemp, "white", false, 1.0);
//                         plotText(name, Render.coordId, "white", false, 1.0);
//                         plotBbox(data.face.bbox)
//                     } else {
//                         plotText(Render.recognizeFaceTitle, Render.coordTitle, "green", true, 0.5);
//                         Render.image.src = "/static/green.svg";
//                     }
//                 }
//                 break;
//             case Status.CLEAN:
//                 Render.ctx.clearRect(0, 0, Render.canvas.width, Render.canvas.height);
//                 plotText(Render.generalTitle, Render.coordTitle, "green", true, 0.5);
//                 Render.image.src = "/static/green.svg";
//                 break;
//         }
//     }
// }

function plotBbox ( bbox ) {
    var ratio = Render.canvas.height / 1920.0;
    var ctx = Render.ctx;
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'white';
    ctx.strokeRect( bbox[0] * ratio, bbox[1] * ratio, ( bbox[2] - bbox[0] ) * ratio, ( bbox[3] - bbox[1 ]) * ratio );
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
        var ws = new WebSocket("ws://10.36.172.146:8000");
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