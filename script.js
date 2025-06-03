
overlay.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 1000);
});

document.addEventListener('DOMContentLoaded', function() {
    const songs = [
        {
            title: "ECHO-ReAdmission Remix - Crusher-P",
            src: "echoreadmission.mp3"
        },
        {
            title: "Grindhouse - Machine Girl",
            src: "grindhouse.mp3"
        },
        {
            title: "Robot Stop - King Gizzard & The Lizard Wizard",
            src: "robotstop.mp3"
        },
        {
            title: "SCAPEGOAT - Ghost and Pals",
            src: "scapegoat.mp3"
        },
        {
            title: "JamieP - FIRE!!!",
            src: "fire.mp3"
        }
    ];

    const audio = new Audio();
    let currentSongIndex = 0;
    let isPlaying = false;
    let audioContext, analyser, dataArray;

    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progress = document.getElementById('progress');
    const progressBar = document.querySelector('.progress-bar');
    const songTitle = document.getElementById('songTitle');
    const songTime = document.getElementById('songTime');
    const volumeSlider = document.getElementById('volumeSlider');

    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

   function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Start visualization only when context is properly initialized
        if (!audioContext) {
            setTimeout(initAudioContext, 100);
            return;
        }
        visualize();
    } catch (e) {
        console.error("AudioContext error:", e);
        setTimeout(initAudioContext, 100);
    }
}

   function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Start visualization only when context is properly initialized
        if (!audioContext) {
            setTimeout(initAudioContext, 100);
            return;
        }
        visualize();
    } catch (e) {
        console.error("AudioContext error:", e);
        setTimeout(initAudioContext, 100);
    }
}

function visualize() {
    if (!analyser) return;
    
    requestAnimationFrame(visualize);
    
    analyser.getByteFrequencyData(dataArray);
    
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 60; 
    const barWidth = canvas.width / barCount;
    let x = 0;

    for (let i = 0; i < barCount; i++) {
        const index = Math.floor(i * 2.5); 
        const barHeight = (dataArray[index] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 200, 0, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
    }
}

    function loadSong(index) {
        const song = songs[index];
        songTitle.textContent = song.title; 
        audio.src = song.src;

        if (!audioContext) {
            initAudioContext();
            visualize();
        }

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

    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });

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
