 overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 1000);
    });

document.addEventListener('DOMContentLoaded', function() {
    const songs = [
        {
            title: "KAT - Left Behind Generation",
            src: "leftbehindgeneration.mp3"
        },
        {
            title: "KAT - Affection Addiction",
            src: "affectionaddiction.mp3"
        },
        {
            title: "KAT - Dizzy Paranoia Girl",
            src: "dizzyparanoia.mp3"
        },
        {
            title: "JamieP - FIRE!!!",
            src: "fire.mp3"
        }
    ];

    const audio = new Audio();
    let currentSongIndex = 0;
    let isPlaying = false;

    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progress = document.getElementById('progress');
    const progressBar = document.querySelector('.progress-bar');
    const songTitle = document.getElementById('songTitle');
    const songTime = document.getElementById('songTime');
    const volumeSlider = document.getElementById('volumeSlider');

    function loadSong(index) {
        const song = songs[index];
        songTitle.textContent = song.title; 
        audio.src = song.src;

        audio.play()
            .then(() => {
                isPlaying = true;
                playPauseIcon.classList.replace('fa-play', 'fa-pause');
            })
            .catch(error => {
                console.log("Autoplay was prevented:", error);
                isPlaying = false;
                playPauseIcon.classList.replace('fa-pause', 'fa-play');
            });
    }

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            playPauseIcon.classList.replace('fa-pause', 'fa-play');
        } else {
            audio.play()
                .then(() => {
                    playPauseIcon.classList.replace('fa-play', 'fa-pause');
                });
        }
        isPlaying = !isPlaying;
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
    }

    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
    }

    function updateProgress() {
        const { duration, currentTime } = audio;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;

        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = Math.floor(duration % 60);
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60);
        
        songTime.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds} / ${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    }

    function setVolume() {
        audio.volume = volumeSlider.value;
    }

    playPauseBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextSong);
    progressBar.addEventListener('click', setProgress);
    volumeSlider.addEventListener('input', setVolume);

    loadSong(currentSongIndex);

    document.addEventListener('click', function initPlayback() {
        if (!isPlaying) {
            audio.play()
                .then(() => {
                    isPlaying = true;
                    playPauseIcon.classList.replace('fa-play', 'fa-pause');
                });
        }
        document.removeEventListener('click', initPlayback);
    }, { once: true });
});

// Add this to your existing script.js
async function detectBPM(audioElement) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioElement);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Simple BPM detection (this is a basic implementation)
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let beats = 0;
    let lastBeatTime = 0;
    let bpm = 120; // Default BPM
    
    function analyze() {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
        }
        
        const average = sum / bufferLength;
        
        // Simple beat detection
        if (average > 20) { // Threshold may need adjustment
            const now = audioContext.currentTime;
            if (now - lastBeatTime > 0.2) { // Debounce
                beats++;
                if (beats > 10) { // Calculate BPM after 10 beats
                    bpm = Math.round(60 / ((now - lastBeatTime) * beats));
                    beats = 0;
                    updatePulseAnimation(bpm);
                }
                lastBeatTime = now;
            }
        }
        
        requestAnimationFrame(analyze);
    }
    
    analyze();
    return bpm;
}

function updatePulseAnimation(bpm) {
    const pulseElements = document.querySelectorAll('.pulse-animation');
    const pulseDuration = 60 / bpm; // Convert BPM to seconds per beat
    
    pulseElements.forEach(el => {
        el.style.animationDuration = `${pulseDuration}s`;
    });
}


async function loadSong(index) {
    const song = songs[index];
    songTitle.textContent = song.title;
    audio.src = song.src;
    

    const response = await fetch(song.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const bpm = await detectBPM(audio); 
    updatePulseAnimation(bpm || 120); 
    
    if (isPlaying) {
        audio.play();
    }
}

audio.addEventListener('play', () => {
    detectBPM(audio);
});
