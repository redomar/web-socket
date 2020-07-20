
let username = `bh592SG4jgDUhthdVGaK`/*${Math.random().toString(36).substring(9)}*/
let callBtn = document.getElementById('call')
let pc
let him
let pcConfig = {
  iceServers: [
    {
      "urls": ["stun:relay.backups.cz"],
    },
    {
      url: 'turn:relay.backups.cz',
      credential: 'webrtc',
      username: 'webrtc'
    },
    {
      url: 'turn:relay.backups.cz?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
  ]
};

const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')


// Set up audio and video regardless of what devices are present.
let sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};


let socket = io.connect('https://www.medicam.io')
socket.emit('join', username)

/////////////////////////////////////////////

socket.on('log', function (logs) {
  console.log(logs);
})

socket.on('on-join', function (unique) {
  console.log((unique) ? `Welcome to ${username} room` : `Room ${username} is full`)
  if (unique) callBtn.classList.remove('hidden')
})


socket.on('on-exists', async function (exists) {
  console.log('calling')
  gotStreamPromise.then(async got => {
    console.log(got);
    createPeerConnection()
    localStream.getTracks().forEach(function (track) {
      pc.addTrack(track, localStream);
    });
    let offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('call', offer);
  })

})

socket.on('on-call', async function (offer) {
  createPeerConnection()
  localStream.getTracks().forEach(function (track) {
    pc.addTrack(track, localStream);
  });
  // let { username, offer } = data

  await pc.setRemoteDescription(new RTCSessionDescription(offer))
  let answer = await pc.createAnswer(sdpConstraints)
  await pc.setLocalDescription(new RTCSessionDescription(answer))
  socket.emit('answer', answer)

  // console.log(data);
})

socket.on('on-answer', async function (answer) {
  console.log('answer');
  console.log(answer);

  let desc = new RTCSessionDescription(answer)
  await pc.setRemoteDescription(desc)
})

socket.on('on-candidate', async function (data) {
  console.log('oncandiate')
  console.log(data)
  if (data) {
    let candidate = new RTCIceCandidate({
      candidate: data.candidate,
      sdpMLineIndex: data.sdpMLineIndex,
      sdpMid: data.sdpMid,
    });
    console.log(candidate);
    pc.addIceCandidate(candidate);

  }
})

/////////////////////////////////////////////

function sendMesage(eventName, data) {
  socket.emit(eventName, data);
}

const gotStreamPromise = navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
  .then(gotStream)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  return true
}

/////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}


function handleIceCandidate(iceConnectionEvent) {
  console.log('icecandidate event: ', iceConnectionEvent);
  if (iceConnectionEvent) {
    socket.emit('candidate', iceConnectionEvent.candidate)
    // sendMessage({
    //   type: 'candidate',
    //   label: candidate.candidate.sdpMLineIndex,
    //   id: candidate.candidate.sdpMid,
    //   candidate: candidate.candidate.candidate
    // });
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

/////////////////////////////////////////////

window.addEventListener('beforeunload', (event) => {
  socket.emit('disconnect')
})









// function setLocalAndSendMessage(sessionDescription) {
//     pc.setLocalDescription(sessionDescription).then(() => {
//         // console.log('setLocalAndSendMessage sending message', sessionDescription);
//         sendMessage(sessionDescription);
//     });
// }

