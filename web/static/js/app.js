import { connectThoth, initRender } from "./rollcall.js";

$(document).ready(function() {
  $("#" + suuid).addClass("active");
  getCodecInfo();
});

let suuid = $("#suuid").val();

let config = {
  iceServers: [{
    urls: ["stun:stun.l.google.com:19302"]
  }]
};

let log = msg => { console.log(msg); }

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

pc.ontrack = function(event) {
  log(event.streams.length + " track is delivered")
  var el = document.createElement(event.track.kind)
  el.id = "main-stream";
  el.srcObject = event.streams[0]
  el.muted = true
  el.autoplay = true
  el.controls = true
  el.setAttribute( "style" , "opacity: 0" );
  document.getElementById( "remoteVideos" ).appendChild(el);
  initRender();
}

pc.oniceconnectionstatechange = e => {
  log(pc.iceConnectionState);
  if ( pc.iceConnectionState === "disconnected" ) {
    log("ICE restart");
    pc.restartIce();
  }
}

connectThoth();

async function handleNegotiationNeededEvent() {
  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  getRemoteSdp();
}

function getCodecInfo() {
  $.get("/codec/" + suuid, function(data) {
    try {
      data = JSON.parse(data);
      console.log(data)
      if (data.length > 1) {
        console.log("add audio Transceiver")
        pc.addTransceiver("audio", {
          "direction": "sendrecv"
        })
      }
    } catch (e) {
      console.log(e);
    } finally {

      log("add video Transceiver")
      pc.addTransceiver("video", {
        "direction": "sendrecv"
      });
    }
  });
}

function getRemoteSdp() {
  $.post("/recive", {
    suuid: suuid,
    data: btoa(pc.localDescription.sdp)
  }, function(data) {
    try {

      pc.setRemoteDescription(new RTCSessionDescription({
        type: "answer",
        sdp: atob(data)
      }))



    } catch (e) {
      console.warn(e);
    }

  });
}