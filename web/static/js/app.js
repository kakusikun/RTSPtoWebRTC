import { connectThoth, initRender } from './rollcall.js';


let sendChannel = null;
let sendChannelTimeId = null;

let suuid = $('#suuid').val();

let config = {
  iceServers: [{
    urls: ['stun:stun.l.google.com:19302']
  }]
};

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
  el.setAttribute( 'style' , 'opacity: 0' );
  document.getElementById( 'remoteVideos' ).appendChild(el);
  initRender();
}

pc.oniceconnectionstatechange = e => {
  log(pc.iceConnectionState);
  if ( pc.iceConnectionState === 'disconnected' ) {
    log('ICE restart');
    pc.restartIce();
  }
}

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
      setUpSendChannel();
    }
  });
}

function setUpSendChannel () {
  sendChannel = pc.createDataChannel('foo');
  sendChannel.onclose = () => console.log('sendChannel has closed');
  sendChannel.onopen = () => {
    console.log('sendChannel has opened');
    sendChannel.send('ping');
    if ( sendChannelTimeId !== null ) {
      clearInterval(sendChannelTimeId);
    }
    sendChannelTimeId = setInterval(() => {
      sendChannel.send('ping');
    }, 1000)
  }
  sendChannel.onmessage = e => log(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`);
  sendChannel.onerror = () => {
      setTimeout(() => {
          console.log("reconnect webrtc");
          if ( pc.iceConnectionState === 'connected') {
            setUpSendChannel();
          }
      }, 5000);
  }
}


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