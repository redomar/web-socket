
let username = `ryan`
let callBtn = document.getElementById('call')
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


socket.on('connect', function () {
  console.log('connected');
})

socket.on('on-join', function (response) {
  console.log(response);
  if (response) {
    callBtn.classList.remove('hidden')
  }
})

socket.on('on-call', function (data) {
  console.log('data');
  console.log(data);
})

socket.on('disconnect', function () {
  console.log('disconnected')
})


// callBtn.addEventListener('click', function () {
//     console.log('calling')
//     const desc  = new RTCPeerConnection(pcConfig);
//     await desc.setLocalDescription()
//     sendMesage('call', {'username': prompt('Call who?', 'simon'), 'offer': desc.toMap()});

// })

function sendMesage(eventName, data) {
  socket.emit(eventName, data);
}

// function setLocalAndSendMessage(sessionDescription) {
//     pc.setLocalDescription(sessionDescription).then(() => {
//       // console.log('setLocalAndSendMessage sending message', sessionDescription);
//       sendMessage(sessionDescription);
//     });
//   }

navigator.mediaDevices.getUserMedia({
  audio: false,
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