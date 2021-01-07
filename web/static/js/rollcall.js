
let Render = {
    generalTitle: "Acer Inc. へようこそ",
    recognizeFaceTitle: "識別中",
    canvas: null,
    ctx: null,
    coordTitleProp: getCoordProp(0, 0, 1080, 175, 57),
    coordTempProp: getCoordProp(0, 175, 1080, 287.5, 112.5),
    coordIdProp: getCoordProp(0, 287.5, 1080, 355, 67.5),
    coordIdTitleProp: getCoordProp(0, 355, 1080, 400, 45),
    coordValidRegionProp: getCoordProp(145, 452, 914, 1465),
    coordTitle: null,
    coordTemp: null,
    coordId: null,
    coordIdTitle: null,
    coordValidRegion: null,
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
    var canvas = document.createElement( 'canvas' );
    var ctx = canvas.getContext('2d');

    canvas.id = 'video-canvas';
    Render.canvas = canvas;
    Render.ctx = ctx;

    $( '#remoteVideos' )[0].appendChild(canvas);

    $( '#main-stream' ).on( 'play', () => {
        console.log( 'played' );
        resizeRender();
        plotText(Render.generalTitle, Render.coordTitle, 'green', true, 0.75, true);
    });
    
    $( window ).resize( () => {
        console.log( 'resized' )
        resizeRender();
        plotText(Render.generalTitle, Render.coordTitle, 'green', true, 0.75, true);
    });
}

function resizeRender () {
    var height =  $( window ).height();
    var videoElt = $( '#main-stream' )[ 0 ];
    if ( videoElt !== null ) {
        var ratio = height / videoElt.videoHeight;
        videoElt.width = videoElt.videoWidth * ratio;
        videoElt.height = height;
        Render.canvas.width = videoElt.videoWidth * ratio;
        Render.canvas.height = height;
        Render.coordTitle = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordTitleProp);
        Render.coordTemp = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordTempProp);
        Render.coordId = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordIdProp);
        Render.coordIdTitle = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordIdTitleProp);
        Render.coordValidRegion = getCoordFromProp(Render.canvas.width, Render.canvas.height, Render.coordValidRegionProp);
    }
}

function plotMessage (face) {
    if ( face.is_stayed ) {
        plotText(Render.generalTitle, Render.coordTitle, 'green', true, 0.75, true);
        plotText(face.temperature, Render.coordTemp, 'green', false, 1.0, true);
        plotText(face.cid.slice(0, 8), Render.coordId, 'green', false, 1.0, true);
    } else {
        plotText(Render.recognizeFaceTitle, Render.coordTitle, 'green', true, 0.75, true);
        plotText(null, Render.coordTemp, 'green', false, 1.0, true);
        plotText(null, Render.coordId, 'green', false, 1.0, true);
    }
}

function plotRecovery () {
    plotText(Render.generalTitle, Render.coordTitle, 'green', true, 0.75, true);
    plotText(null, Render.coordTemp, 'green', false, 1.0, true);
    plotText(null, Render.coordId, 'green', false, 1.0, true);
}

function plotText( text, coord, level, background, alpha, clear) {
    if ( Render.ctx !== null && coord !== null ) {
        var ctx = Render.ctx;
        var canvas = Render.canvas;

        if ( clear ) {
            ctx.clearRect(
                coord.tl.x,
                coord.tl.y,
                coord.w,
                coord.h,
            );
        }

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
                case 'red':
                    ctx.fillStyle = 'rgb(228, 41, 64)';
                    break;
                case 'green':
                    ctx.fillStyle = 'rgb(121, 175, 42)';
                    break;
                case 'orange':
                    ctx.fillStyle = 'rgb(255, 160, 4)';
                    break;
            }
    
            ctx.font = `bold ${ parseInt( 10 * textScale ) }px 'Noto Sans TC'`;
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

function connectThoth () {
    try {
        var ws = new WebSocket('ws://10.36.172.146:8000');
        ws.onopen = () => console.log('connected');
        ws.onclose = () => console.log('disconnected');
        ws.onmessage = (msg) => {
            try {
                var face = JSON.parse(msg.data);
                plotMessage(face);
            } catch (e) {
                console.log(e);
            }
        }
        ws.onerror = (msg) => {
            setTimeout(() => {
                console.log("reconnect");
                connectThoth();
            }, 10000);
            console.log(msg.data);
        }
    } catch (e) {
        alert('websocket is not connected');
    }
}


export { connectThoth, initRender };