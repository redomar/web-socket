
let username = `ryan-${Math.random().toString(36).substring(9)}`
let callBtn = document.getElementById('call')
let pc
let him
let pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun4.l.google.com:19302'
  }]
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
  console.log((unique) ? `User ${username} is unique` : `User ${username} already exists`)
  if (unique) callBtn.classList.remove('hidden')
})



callBtn.addEventListener('click', async function () {
  console.log('calling')
  createPeerConnection()
  localStream.getTracks().forEach(function (track) {
    pc.addTrack(track, localStream);
  });
  let offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.emit('call', offer);

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

  let candidate = new RTCIceCandidate({
    sdpMLineIndex: data.sdpMLineIndex,
    sdpMid: data.sdpMid,
    candidate: data.candidate,
  });
  await pc.addIceCandidate(candidate);
})

/////////////////////////////////////////////

function sendMesage(eventName, data) {
  socket.emit(eventName, data);
}

navigator.mediaDevices.getUserMedia({
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
  // sendMessage('got user media');
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











// function setLocalAndSendMessage(sessionDescription) {
//     pc.setLocalDescription(sessionDescription).then(() => {
//         // console.log('setLocalAndSendMessage sending message', sessionDescription);
//         sendMessage(sessionDescription);
//     });
// }

