import { connectThoth, initRender } from './rollcall.js';

let suuid = $('#suuid').val();

let config = {
  iceServers: [{
    urls: ['stun:stun.l.google.com:19302']
  }]
};

// let render = {
//     canvas: null,
//     ctx: null,
// };

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

let log = msg => { console.log(msg); }

pc.ontrack = function(event) {
  log(event.streams.length + ' track is delivered')
  var el = document.createElement(event.track.kind)


  el.id = 'main-stream';
  el.srcObject = event.streams[0]
  el.muted = true
  el.autoplay = true
  el.controls = true
  el.setAttribute( 'style' , '' );

  // canvas.id = 'render-video';
  // render.canvas = canvas;

  // render.ctx = ctx;

  document.getElementById( 'remoteVideos' ).appendChild(el);
  // document.getElementById( 'remoteVideos' ).appendChild(canvas);

  initRender();
}

// function resize () {
//   var height =  $( window ).height();
//   var videoElt = $( '#main-stream' )[ 0 ];
//   if ( videoElt !== null ) {
//     var ratio = height / videoElt.videoHeight;
//     videoElt.width = videoElt.videoWidth * ratio;
//     videoElt.height = height;
//     render.canvas.width = videoElt.videoWidth * ratio;
//     render.canvas.height = height;
//   }
// }

// function plotText (text, level = 0) {
//     if ( render.ctx !== null ) {
//         render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
//         render.ctx.font = "10px Arial";
//         var metric = render.ctx.measureText(text);
//         var textScale = render.canvas.width / metric.width;
//         render.ctx.font = `${ parseInt( 10 * textScale ) }px Arial`;
//         if ( level === 0) {
//             render.ctx.fillStyle = 'rgb(42, 175, 121)';
//             render.ctx.strokeStyle = 'rgb(255, 255, 255)';
//         }
//         var center = {
//             x: parseInt(render.canvas.width/2),
//             y: metric.actualBoundingBoxAscent + 10,
//         }
//         render.ctx.textAlign = "center";
//         render.ctx.fillText(text, center.x, center.y);
//         render.ctx.strokeText(text, center.x, center.y);
//     }
// }

pc.oniceconnectionstatechange = e => log(pc.iceConnectionState)

// function connectThoth () {
//     let ws = new WebSocket('ws://10.36.172.146:8000')
//     ws.onopen = () => console.log('connected');
//     ws.onclose = () => console.log('disconnected');
//     ws.onmessage = msg => plotText(msg.data);
//     ws.onerror = (msg) => {
//         setTimeout(() => {
//             console.log("reconnect");
//             connectThoth();
//         }, 10000);
//         console.log(msg.data);
//     }
// }
connectThoth();


async function handleNegotiationNeededEvent() {
  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  getRemoteSdp();
}

$(document).ready(function() {
  $('#' + suuid).addClass('active');
  getCodecInfo();
});


function getCodecInfo() {
  $.get('/codec/' + suuid, function(data) {
    try {
      data = JSON.parse(data);
      console.log(data)
      if (data.length > 1) {
        console.log('add audio Transceiver')
        pc.addTransceiver('audio', {
          'direction': 'sendrecv'
        })
      }
    } catch (e) {
      console.log(e);
    } finally {

      log('add video Transceiver')
      pc.addTransceiver('video', {
        'direction': 'sendrecv'
      });
      //send ping becouse PION not handle RTCSessionDescription.close()
      sendChannel = pc.createDataChannel('foo');
      sendChannel.onclose = () => console.log('sendChannel has closed');
      sendChannel.onopen = () => {
        console.log('sendChannel has opened');
        sendChannel.send('ping');
        setInterval(() => {
          sendChannel.send('ping');
        }, 1000)
      }
      sendChannel.onmessage = e => log(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`);
    }
  });
}

let sendChannel = null;

function getRemoteSdp() {
  $.post('/recive', {
    suuid: suuid,
    data: btoa(pc.localDescription.sdp)
  }, function(data) {
    try {

      pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: atob(data)
      }))



    } catch (e) {
      console.warn(e);
    }

  });
}