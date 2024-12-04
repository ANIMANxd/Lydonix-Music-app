const API_KEY = 'AIzaSyBZGUD5i1g2ac73yIw6At8aSfELHnFwi-8';
let player;
let currentPlaylist = [];
let currentIndex = -1;
let progressInterval;

// DOM Elements
const searchBar = document.querySelector('.search-bar');
const searchBtn = document.querySelector('.search-btn');
const resultsContainer = document.querySelector('.results');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.querySelector('.volume-slider');
const currentTitle = document.querySelector('.current-title');
const currentChannel = document.querySelector('.current-channel');
const currentThumbnail = document.querySelector('.current-thumbnail');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const currentTimeElement = document.querySelector('.current-time');
const durationElement = document.querySelector('.duration');

// Initializing YouTube Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player-iframe', {
        height: '0',
        width: '0',
        events: {
            'onStateChange': onPlayerStateChange,
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady() {
    volumeSlider.value = player.getVolume();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    } else if (event.data === YT.PlayerState.PLAYING) {
        startProgressUpdate();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else if (event.data === YT.PlayerState.PAUSED) {
        stopProgressUpdate();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// Search function
searchBtn.addEventListener('click', performSearch);
searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const query = searchBar.value;
    if (!query) return;

    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${API_KEY}&maxResults=20`)
        .then(response => response.json())
        .then(data => {
            currentPlaylist = data.items;
            displayResults(data.items);
        })
        .catch(error => console.error('Error:', error));
}

function displayResults(items) {
    resultsContainer.innerHTML = '';
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}" class="song-thumbnail">
            <div class="song-info">
                <div class="song-title">${item.snippet.title}</div>
                <div class="song-channel">${item.snippet.channelTitle}</div>
            </div>
        `;
        card.addEventListener('click', () => playSong(index));
        resultsContainer.appendChild(card);
    });
}

// Player controls
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
volumeSlider.addEventListener('input', updateVolume);

// Progress bar 
progressBar.addEventListener('click', (e) => {
    const progressWidth = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = player.getDuration();
    const newTime = (clickX / progressWidth) * duration;
    player.seekTo(newTime, true);
});

function playSong(index) {
    currentIndex = index;
    const song = currentPlaylist[index];
    player.loadVideoById(song.id.videoId);
    updatePlayerInfo(song);
}

function togglePlay() {
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function playPrevious() {
    if (currentIndex > 0) {
        playSong(currentIndex - 1);
    }
}

function playNext() {
    if (currentIndex < currentPlaylist.length - 1) {
        playSong(currentIndex + 1);
    }
}

function updateVolume() {
    player.setVolume(volumeSlider.value);
}

function updatePlayerInfo(song) {
    currentTitle.textContent = song.snippet.title;
    currentChannel.textContent = song.snippet.channelTitle;
    currentThumbnail.src = song.snippet.thumbnails.default.url;
}

// Progress updates
function startProgressUpdate() {
    stopProgressUpdate();
    progressInterval = setInterval(updateProgress, 1000);
}

function stopProgressUpdate() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

function updateProgress() {
    if (player && player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        
        currentTimeElement.textContent = formatTime(currentTime);
        durationElement.textContent = formatTime(duration);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // no trigger if typing in search

    switch(e.key.toLowerCase()) {
        case ' ':  
            e.preventDefault();
            togglePlay();
            break;
        case 'arrowright':
            playNext();
            break;
        case 'arrowleft':
            playPrevious();
            break;
        case 'm':
            if (volumeSlider.value > 0) {
                volumeSlider.dataset.lastVolume = volumeSlider.value;
                volumeSlider.value = 0;
            } else {
                volumeSlider.value = volumeSlider.dataset.lastVolume || 100;
            }
            updateVolume();
            break;
    }
});

// volume icon based on level
volumeSlider.addEventListener('input', updateVolumeIcon);

function updateVolumeIcon() {
    const volumeIcon = volumeSlider.previousElementSibling;
    const volume = volumeSlider.value;
    
    if (volume == 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 30) {
        volumeIcon.className = 'fas fa-volume-off';
    } else if (volume < 70) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// Error handling
function handleError(error) {
    console.error('Error:', error);
    currentTitle.textContent = 'Error playing track';
    currentChannel.textContent = 'Please try another song';
    stopProgressUpdate();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopProgressUpdate();
    if (player && player.destroy) {
        player.destroy();
    }
});

// volume icon on load
updateVolumeIcon();
