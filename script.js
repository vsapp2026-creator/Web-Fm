document.addEventListener('DOMContentLoaded', () => {

    // --- Audio Player Logic with Cross-Page State ---
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const playerStatusBadge = document.getElementById('player-status-badge');
    const progressCircle = document.getElementById('progress-circle');

    // Mini Player Elements
    const miniPlayer = document.getElementById('mini-player');
    const miniPlayBtn = document.getElementById('mini-play-btn');
    const miniVolume = document.getElementById('mini-volume');
    const miniStatusDot = document.getElementById('mini-status-dot');

    let isPlaying = false;

    // Determine if we're on the main page or other pages
    const isMainPage = playPauseBtn !== null;

    // Helper functions for cross-page state
    function savePlayerState() {
        localStorage.setItem('webfm_playing', isPlaying);
        localStorage.setItem('webfm_volume', audioPlayer.volume);
    }

    function loadPlayerState() {
        const wasPlaying = localStorage.getItem('webfm_playing') === 'true';
        const savedVolume = localStorage.getItem('webfm_volume');

        if (savedVolume) {
            audioPlayer.volume = parseFloat(savedVolume);
            if (volumeSlider) volumeSlider.value = savedVolume;
            if (miniVolume) miniVolume.value = savedVolume;
        }

        // Auto-resume if was playing
        if (wasPlaying && audioPlayer) {
            setTimeout(() => {
                audioPlayer.play().catch(err => {
                    console.log("Auto-play prevented:", err);
                });
            }, 300); // Small delay to ensure page is ready
        }
    }

    if (audioPlayer) {

        // Load previous state on page load
        loadPlayerState();

        // Play/Pause Toggle - Main Player
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                togglePlayPause();
            });
        }

        // Play/Pause Toggle - Mini Player
        if (miniPlayBtn) {
            miniPlayBtn.addEventListener('click', () => {
                togglePlayPause();
            });
        }

        function togglePlayPause() {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                const playPromise = audioPlayer.play();

                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        // Status handled by 'playing' event
                    })
                        .catch(error => {
                            console.error("Playback failed:", error);
                            setPlayerStatus('OFFLINE', false);
                        });
                }
            }
        }

        // Volume Control - Main Player
        if (volumeSlider) {
            audioPlayer.volume = volumeSlider.value;
            volumeSlider.addEventListener('input', (e) => {
                audioPlayer.volume = e.target.value;
                if (miniVolume) miniVolume.value = e.target.value;
                savePlayerState();
            });
        }

        // Volume Control - Mini Player
        if (miniVolume) {
            audioPlayer.volume = miniVolume.value;
            miniVolume.addEventListener('input', (e) => {
                audioPlayer.volume = e.target.value;
                if (volumeSlider) volumeSlider.value = e.target.value;
                savePlayerState();
            });
        }
    }

    // --- Status & UI Helpers ---
    function setPlayerStatus(text, isOnline) {
        // Main player status badge
        if (playerStatusBadge) {
            const dotColor = isOnline ? 'bg-green-500' : 'bg-red-500';
            const badgeBg = isOnline ? 'bg-green-100' : 'bg-red-100';
            const badgeText = isOnline ? 'text-green-600' : 'text-red-600';
            const badgeBorder = isOnline ? 'border-green-200' : 'border-red-200';

            playerStatusBadge.className = `${badgeBg} ${badgeText} ${badgeBorder} text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border-2 transition-all duration-300`;
            playerStatusBadge.innerHTML = `<span class="w-2 h-2 ${dotColor} rounded-full ${isOnline ? 'animate-pulse' : ''}"></span> ${text}`;
        }

        // Mini player status dot
        if (miniStatusDot) {
            if (isOnline) {
                miniStatusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
            } else {
                miniStatusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
            }
        }
    }

    function updatePlayButton(playing) {
        // Main player button
        if (playPauseBtn) {
            const icon = playPauseBtn.querySelector('i');
            if (playing) {
                icon.classList.remove('fa-play', 'pl-2');
                icon.classList.add('fa-pause');
                if (progressCircle) {
                    progressCircle.style.strokeDashoffset = '0';
                }
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play', 'pl-2');
                if (progressCircle) {
                    progressCircle.style.strokeDashoffset = '565';
                }
            }
        }

        // Mini player button
        if (miniPlayBtn) {
            const miniIcon = miniPlayBtn.querySelector('i');
            if (playing) {
                miniIcon.classList.remove('fa-play', 'pl-1');
                miniIcon.classList.add('fa-pause');
            } else {
                miniIcon.classList.remove('fa-pause');
                miniIcon.classList.add('fa-play', 'pl-1');
            }
        }
    }

    // Standard Events
    if (audioPlayer) {
        audioPlayer.addEventListener('playing', () => {
            setPlayerStatus('ONLINE', true);
            isPlaying = true;
            updatePlayButton(true);
            savePlayerState();
        });

        audioPlayer.addEventListener('pause', () => {
            setPlayerStatus('OFFLINE', false);
            isPlaying = false;
            updatePlayButton(false);
            savePlayerState();
        });

        audioPlayer.addEventListener('ended', () => {
            setPlayerStatus('OFFLINE', false);
            isPlaying = false;
            updatePlayButton(false);
            savePlayerState();
        });

        audioPlayer.addEventListener('waiting', () => {
            // Optional: Show buffering state
        });

        audioPlayer.addEventListener('error', () => {
            setPlayerStatus('OFFLINE', false);
            isPlaying = false;
            updatePlayButton(false);
            savePlayerState();
        });

        // Time Update
        const currentTimeEl = document.getElementById('current-time');

        audioPlayer.addEventListener('timeupdate', () => {
            if (currentTimeEl) {
                currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            }
        });
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }


    // --- Comment System ---
    const commentForm = document.getElementById('comment-form');
    const commentsCarousel = document.getElementById('comments-carousel');
    const prevBtn = document.getElementById('prev-comment');
    const nextBtn = document.getElementById('next-comment');
    const dotsContainer = document.getElementById('carousel-dots');

    let comments = [];
    let currentSlide = 0;

    // Load comments from localStorage
    function loadComments() {
        const savedComments = localStorage.getItem('webfm_comments');
        if (savedComments) {
            comments = JSON.parse(savedComments);
            renderComments();
        }
    }

    // Save comments to localStorage
    function saveComments() {
        localStorage.setItem('webfm_comments', JSON.stringify(comments));
    }

    // Render all comments
    function renderComments() {
        if (!commentsCarousel) return;

        // Keep the default comment and add user comments
        const defaultComment = commentsCarousel.querySelector('.min-w-full');
        commentsCarousel.innerHTML = '';
        commentsCarousel.appendChild(defaultComment);

        comments.forEach((comment, index) => {
            const commentEl = createCommentElement(comment);
            commentsCarousel.appendChild(commentEl);
        });

        updateCarousel();
        updateDots();
    }

    // Create comment element
    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'min-w-full bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-lg';

        const initial = comment.name.charAt(0).toUpperCase();

        div.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    ${initial}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-bold text-slate-900">${escapeHtml(comment.name)}</h4>
                        <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-semibold">
                            <i class="fas fa-globe-americas mr-1"></i> ${escapeHtml(comment.country)}
                        </span>
                    </div>
                    <p class="text-slate-600 leading-relaxed">
                        ${escapeHtml(comment.text)}
                    </p>
                </div>
            </div>
        `;

        return div;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update carousel position
    function updateCarousel() {
        if (!commentsCarousel) return;
        const totalComments = commentsCarousel.children.length;
        commentsCarousel.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update button states
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalComments - 1;
    }

    // Update dots
    function updateDots() {
        if (!dotsContainer || !commentsCarousel) return;

        const totalComments = commentsCarousel.children.length;
        dotsContainer.innerHTML = '';

        for (let i = 0; i < totalComments; i++) {
            const dot = document.createElement('span');
            dot.className = `w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-6' : 'bg-slate-300'}`;
            dotsContainer.appendChild(dot);
        }
    }

    // Handle comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('comment-name').value.trim();
            const country = document.getElementById('comment-country').value.trim();
            const text = document.getElementById('comment-text').value.trim();

            if (name && country && text) {
                const newComment = { name, country, text, timestamp: Date.now() };
                comments.push(newComment);
                saveComments();
                renderComments();

                // Reset form
                commentForm.reset();

                // Move to the new comment
                currentSlide = comments.length; // +1 for default comment
                updateCarousel();
                updateDots();

                // Show success feedback
                const submitBtn = commentForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Sent!';
                submitBtn.classList.add('bg-green-500');

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('bg-green-500');
                }, 2000);
            }
        });
    }

    // Carousel navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
                updateDots();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalComments = commentsCarousel.children.length;
            if (currentSlide < totalComments - 1) {
                currentSlide++;
                updateCarousel();
                updateDots();
            }
        });
    }

    // Auto-rotate carousel
    setInterval(() => {
        if (commentsCarousel && commentsCarousel.children.length > 1) {
            const totalComments = commentsCarousel.children.length;
            currentSlide = (currentSlide + 1) % totalComments;
            updateCarousel();
            updateDots();
        }
    }, 5000);

    // Load comments on page load
    loadComments();


    // --- Mobile Menu Logic ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('translate-x-full');
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
        });
    }

    // --- About Popup Logic ---
    const aboutPopup = document.getElementById('about-popup');
    const closePopupBtn = document.getElementById('close-popup');
    const popupCta = document.getElementById('popup-cta');

    if (aboutPopup) {
        // Show after small delay
        setTimeout(() => {
            aboutPopup.classList.remove('opacity-0', 'pointer-events-none');
        }, 1000);

        function closePopup() {
            aboutPopup.classList.add('opacity-0', 'pointer-events-none');
        }

        if (closePopupBtn) closePopupBtn.addEventListener('click', closePopup);
        if (popupCta) popupCta.addEventListener('click', closePopup);

        // Close on background click
        aboutPopup.addEventListener('click', (e) => {
            if (e.target === aboutPopup) closePopup();
        });
    }

});
