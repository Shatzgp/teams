const socket = io();

navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        const videoElement = document.getElementById('videoPlayer');
        videoElement.srcObject = stream;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.width;
        canvas.height = videoElement.height;

        setInterval(() => {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg');
            socket.emit('stream', imageData);
        }, 1000);
    })
    .catch((error) => {
        console.error('Error accessing webcam: ', error);
    });

socket.on('stream', (image) => {
    const videoElement = document.getElementById('videoPlayer');
    videoElement.src = image;
});

let stream;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((userStream) => {
        stream = userStream;

        const videoElement = document.getElementById('videoPlayer');
        videoElement.srcObject = stream;

        // Rest of your code for capturing frames and streaming
    })
    .catch((error) => {
        console.error('Error accessing webcam and microphone: ', error);
    });

const muteButton = document.getElementById('muteButton');
const cameraButton = document.getElementById('cameraButton');

let isAudioMuted = false;
let isCameraOff = false;

muteButton.addEventListener('click', () => {
    isAudioMuted = !isAudioMuted;
    stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioMuted;
    });
    muteButton.innerText = isAudioMuted ? 'Unmute' : 'Mute';
});

cameraButton.addEventListener('click', () => {
    isCameraOff = !isCameraOff;
    stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
    });
    cameraButton.innerText = isCameraOff ? 'Turn On Camera' : 'Turn Off Camera';
});

const userList = document.getElementById('userList');

io.on('connection', (socket) => {
    console.log('a user connected');

    // Get user's ID from socket connection
    const userId = socket.id;

    // Add user to the users tab
    const userItem = document.createElement('li');
    userItem.innerText = `User ${userId.substring(0, 6)}`;
    userList.appendChild(userItem);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        // Remove user from the users tab on disconnect
        userItem.remove();
    });

});

const recordButton = document.getElementById('recordButton');
let mediaRecorder;
let chunks = [];

recordButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.ondataavailable = null;
        recordButton.innerText = 'Start Recording';
    } else {
        startRecording();
        recordButton.innerText = 'Stop Recording';
    }
});

function startRecording() {
    chunks = [];
    const options = { mimeType: 'video/webm; codecs=vp9' };

    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        console.error('Error creating MediaRecorder:', e);
        return;
    }

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = 'recording.webm';
        downloadLink.click();
    };

    mediaRecorder.start();
}

const volumeSlider = document.getElementById('volumeSlider');

volumeSlider.addEventListener('input', () => {
    const volume = volumeSlider.value;
    if (stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((track) => {
            track.enabled = volume > 0;
            track.setVolume(volume);
        });
    }
});
