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
