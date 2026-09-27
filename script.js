/**
 * ===================================================================
 * [BUSINESS NAME] AUTO LAB - PRESTIGE AUTOMOTIVE DETAILING LOGIC
 * Features:
 *  1. Signature Scroll Physics Engine:
 *     - Downscroll: Water/shower cascade rinse effect
 *     - Upscroll: Microfiber towel buff & specular gloss sheen sweep
 *  2. Interactive Before/After Split Transformation Slider
 *  3. Interactive Service Package Picker & Live Price Estimator
 *  4. Synthesized Detailing Web Audio FX (Water Rinse & Towel Buff)
 *  5. Booking Form Submission & Confirmation UI
 *  6. Responsive Navigation & Mobile Drawer
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* =================================================================
     1. SIGNATURE SCROLL PHYSICS ENGINE (WATER RINSE & TOWEL BUFF)
     ================================================================= */
  const canvas = document.getElementById('scroll-fx-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const glossSweep = document.getElementById('gloss-sweep');
  const wipeStreak = document.getElementById('wipe-streak');
  const waterRipple = document.getElementById('water-ripple-layer');
  const liveIndicator = document.getElementById('live-scroll-indicator');
  const fxLiveCaption = document.getElementById('fx-live-caption');
  const fxIconDisplay = document.getElementById('fx-icon-display');
  const fxModeBtn = document.getElementById('fx-mode-btn');
  const fxStatusText = document.getElementById('fx-status-text');

  // Canvas Sizing
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Scroll Tracking State
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let scrollDirection = 0; // 1 = down, -1 = up, 0 = still
  let isScrolling = false;
  let scrollTimeout = null;
  let fxMode = 'subtle'; // 'subtle', 'expressive', 'off'

  // Droplet Particle Pool (Optimized for 60-120fps)
  const MAX_DROPLETS = 75;
  const droplets = [];

  class WaterDrop {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -30 - Math.random() * 80;
      this.length = 12 + Math.random() * 26;
      this.width = 1.4 + Math.random() * 1.8;
      this.speed = 14 + Math.random() * 18;
      this.opacity = 0.25 + Math.random() * 0.45;
      this.angle = 0.05 + Math.random() * 0.08; // subtle dynamic slant
      this.color = Math.random() > 0.4 ? 'rgba(0, 210, 255,' : 'rgba(255, 255, 255,';
      this.life = 0;
      this.maxLife = 120 + Math.random() * 80;
      this.active = false;
    }

    spawn(speedBoost = 1) {
      this.reset();
      this.speed *= speedBoost;
      this.active = true;
    }

    update() {
      if (!this.active) return;
      this.y += this.speed;
      this.x += Math.sin(this.angle) * (this.speed * 0.2);
      this.life++;

      // Reached bottom
      if (this.y > height + 40 || this.life > this.maxLife) {
        this.active = false;
      }
    }

    draw(context) {
      if (!this.active) return;
      context.save();
      context.beginPath();
      
      const grad = context.createLinearGradient(
        this.x, this.y - this.length,
        this.x, this.y
      );
      grad.addColorStop(0, 'rgba(0, 210, 255, 0)');
      grad.addColorStop(0.5, `${this.color} ${this.opacity * 0.7})`);
      grad.addColorStop(1, `${this.color} ${this.opacity})`);

      context.strokeStyle = grad;
      context.lineWidth = this.width;
      context.lineCap = 'round';
      
      context.moveTo(this.x - this.angle * this.length, this.y - this.length);
      context.lineTo(this.x, this.y);
      context.stroke();

      // Droplet Head Bead
      context.beginPath();
      context.arc(this.x, this.y, this.width * 1.1, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.9})`;
      context.fill();

      context.restore();
    }
  }

  // Prepopulate Particle Pool
  for (let i = 0; i < MAX_DROPLETS; i++) {
    droplets.push(new WaterDrop());
  }

  // Towel Buff Streak State
  let sweepDebounce = false;
  let lastSweepTime = 0;

  // Render Loop
  function renderPhysicsEngine() {
    ctx.clearRect(0, 0, width, height);

    if (fxMode !== 'off') {
      let activeCount = 0;
      for (let i = 0; i < droplets.length; i++) {
        if (droplets[i].active) {
          droplets[i].update();
          droplets[i].draw(ctx);
          activeCount++;
        }
      }
    }

    requestAnimationFrame(renderPhysicsEngine);
  }
  requestAnimationFrame(renderPhysicsEngine);

  // Trigger Downscroll Water Rinse
  function triggerWaterRinse(velocity) {
    if (fxMode === 'off') return;

    const count = fxMode === 'expressive' 
      ? Math.min(Math.floor(Math.abs(velocity) * 1.5), 25) 
      : Math.min(Math.floor(Math.abs(velocity) * 0.8), 12);

    let spawned = 0;
    for (let i = 0; i < droplets.length && spawned < count; i++) {
      if (!droplets[i].active) {
        droplets[i].spawn(1 + Math.min(Math.abs(velocity) * 0.05, 1.5));
        spawned++;
      }
    }

    // Ripple subtle flash
    if (waterRipple) {
      waterRipple.classList.add('active');
      clearTimeout(waterRipple._timer);
      waterRipple._timer = setTimeout(() => {
        waterRipple.classList.remove('active');
      }, 400);
    }

    // Update HUD Indicator
    updateHUDIndicator('down', 'Hydro-Rinse & Foam Shower');
    
    // Detailing Audio FX
    playSensorySound('water');
  }

  // Trigger Upscroll Towel Wipe & Buff
  function triggerTowelBuff(velocity) {
    if (fxMode === 'off') return;

    const now = Date.now();
    if (now - lastSweepTime > 800) {
      lastSweepTime = now;

      // Trigger specular gloss gleam animation
      if (glossSweep) {
        glossSweep.classList.remove('trigger-sweep');
        // Force reflow
        void glossSweep.offsetWidth;
        glossSweep.classList.add('trigger-sweep');
      }

      // Microfiber soft streak overlay
      if (wipeStreak) {
        wipeStreak.classList.add('active');
        clearTimeout(wipeStreak._timer);
        wipeStreak._timer = setTimeout(() => {
          wipeStreak.classList.remove('active');
        }, 700);
      }

      // Detailing Audio FX
      playSensorySound('towel');
    }

    // Update HUD Indicator
    updateHUDIndicator('up', 'Microfiber Buff & Polish Shine');
  }

  // Update HUD pill with appropriate icon and text
  let hudHideTimeout = null;
  function updateHUDIndicator(direction, text) {
    if (!liveIndicator || !fxLiveCaption || !fxIconDisplay) return;

    liveIndicator.classList.add('visible');

    if (direction === 'down') {
      fxIconDisplay.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      `;
      fxLiveCaption.textContent = text;
    } else if (direction === 'up') {
      fxIconDisplay.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      `;
      fxLiveCaption.textContent = text;
    }

    clearTimeout(hudHideTimeout);
    hudHideTimeout = setTimeout(() => {
      liveIndicator.classList.remove('visible');
    }, 1800);
  }

  // Scroll Event Listener with Velocity Calculation
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;
    scrollVelocity = deltaY;

    if (Math.abs(deltaY) > 3) {
      if (deltaY > 0) {
        // Scrolling Down -> Water Rinse Shower
        scrollDirection = 1;
        triggerWaterRinse(deltaY);
      } else {
        // Scrolling Up -> Towel Wipe & Buff
        scrollDirection = -1;
        triggerTowelBuff(deltaY);
      }
    }

    lastScrollY = currentScrollY;

    // Sticky Navbar background blur
    const navbar = document.getElementById('navbar');
    if (navbar) {
      if (currentScrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  // FX Intensity Mode Toggle
  if (fxModeBtn && fxStatusText) {
    fxModeBtn.addEventListener('click', () => {
      if (fxMode === 'subtle') {
        fxMode = 'expressive';
        fxStatusText.textContent = 'FX: Expressive High-Def';
        showToast('FX Mode: Expressive High-Def Cascade');
      } else if (fxMode === 'expressive') {
        fxMode = 'off';
        fxStatusText.textContent = 'FX: Disabled';
        showToast('FX Mode: Ambient Effects Off');
      } else {
        fxMode = 'subtle';
        fxStatusText.textContent = 'FX: Hydro / Buff Active';
        showToast('FX Mode: Subtle & Balanced Active');
      }
    });
  }


  /* =================================================================
     2. BEFORE / AFTER INTERACTIVE COMPARISON SLIDER
     ================================================================= */
  const comparisonCard = document.getElementById('comparison-card');
  const dirtyClipLayer = document.getElementById('dirty-clip-layer');
  const sliderDivider = document.getElementById('slider-divider');
  const sliderHandle = document.getElementById('slider-handle');
  const dragHint = document.getElementById('drag-hint');

  if (comparisonCard && dirtyClipLayer && sliderDivider && sliderHandle) {
    let isDragging = false;
    let sliderPos = 50; // percentage

    function updateSlider(percentage) {
      // Clamp between 2% and 98%
      percentage = Math.max(2, Math.min(98, percentage));
      sliderPos = percentage;

      dirtyClipLayer.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
      sliderDivider.style.left = `${percentage}%`;
      sliderHandle.setAttribute('aria-valuenow', Math.round(percentage));

      // Fade out hint on first interaction
      if (dragHint && dragHint.style.opacity !== '0') {
        dragHint.style.opacity = '0';
        setTimeout(() => { dragHint.remove(); }, 600);
      }
    }

    function handleMove(clientX) {
      const rect = comparisonCard.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      updateSlider(percentage);
    }

    // Pointer Events (Mouse + Touch unified)
    comparisonCard.addEventListener('pointerdown', (e) => {
      isDragging = true;
      comparisonCard.setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    });

    comparisonCard.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    });

    const stopDragging = (e) => {
      if (isDragging) {
        isDragging = false;
        try {
          comparisonCard.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    };

    comparisonCard.addEventListener('pointerup', stopDragging);
    comparisonCard.addEventListener('pointercancel', stopDragging);

    // Keyboard accessibility for slider
    sliderHandle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        updateSlider(sliderPos - 5);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        updateSlider(sliderPos + 5);
        e.preventDefault();
      }
    });

    // Auto subtle breathing demonstration on idle if not touched
    let autoDemoPassed = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !autoDemoPassed && !isDragging) {
          autoDemoPassed = true;
          // Smooth intro peek
          let step = 0;
          const introInterval = setInterval(() => {
            if (isDragging) {
              clearInterval(introInterval);
              return;
            }
            step++;
            const offset = Math.sin(step * 0.1) * 8;
            updateSlider(50 + offset);
            if (step > 60) {
              clearInterval(introInterval);
              updateSlider(50);
            }
          }, 25);
        }
      });
    }, { threshold: 0.4 });
    observer.observe(comparisonCard);
  }


  /* =================================================================
     3. SERVICE PACKAGE PICKER & LIVE PRICE CALCULATOR
     ================================================================= */
  const bookingForm = document.getElementById('detailing-booking-form');
  const serviceCheckboxes = document.querySelectorAll('.svc-calc-input');
  const vehicleOptions = document.querySelectorAll('.vehicle-option input');
  const liveTotalEl = document.getElementById('live-total-estimate');
  const selectServiceBtns = document.querySelectorAll('.select-service-btn');

  function calculateEstimate() {
    let servicesTotal = 0;
    serviceCheckboxes.forEach(chk => {
      if (chk.checked) {
        servicesTotal += parseFloat(chk.getAttribute('data-base-price') || 0);
      }
    });

    // Vehicle Surcharge
    let vehicleSurcharge = 0;
    const selectedVeh = document.querySelector('input[name="vehicle-type"]:checked');
    if (selectedVeh) {
      if (selectedVeh.value.includes('Midsize')) {
        vehicleSurcharge = 30;
      } else if (selectedVeh.value.includes('Truck') || selectedVeh.value.includes('3-Row')) {
        vehicleSurcharge = 50;
      }
    }

    const grandTotal = servicesTotal + (servicesTotal > 0 ? vehicleSurcharge : 0);
    if (liveTotalEl) {
      liveTotalEl.textContent = `$${grandTotal}`;
      // subtle bump animation
      liveTotalEl.style.transform = 'scale(1.1)';
      setTimeout(() => { liveTotalEl.style.transform = 'scale(1)'; }, 200);
    }
  }

  // Checkbox and Radio listeners
  serviceCheckboxes.forEach(chk => chk.addEventListener('change', calculateEstimate));
  vehicleOptions.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.vehicle-option').forEach(el => el.classList.remove('selected'));
      e.target.closest('.vehicle-option').classList.add('selected');
      calculateEstimate();
    });
  });

  // Location preference radio pill toggles
  const locationPills = document.querySelectorAll('.radio-pill input');
  locationPills.forEach(pill => {
    pill.addEventListener('change', () => {
      document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
      pill.closest('.radio-pill').classList.add('active');
    });
  });

  // "Select Service" buttons on Service Cards
  selectServiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetServiceName = btn.getAttribute('data-target-service');
      
      // Auto check the matching box in the booking form
      serviceCheckboxes.forEach(chk => {
        if (targetServiceName && targetServiceName.includes(chk.closest('.service-checkbox-label').querySelector('.chk-name').textContent.trim())) {
          chk.checked = true;
        }
      });

      calculateEstimate();

      // Smooth scroll to booking section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        
        // Highlight form momentarily
        bookingForm.classList.add('highlight-pulse');
        setTimeout(() => {
          bookingForm.classList.remove('highlight-pulse');
        }, 1500);

        showToast(`Added ${targetServiceName.split('(')[0].trim()} to your booking request!`);
      }
    });
  });

  // Calculate initially
  calculateEstimate();


  /* =================================================================
     4. FORM SUBMISSION & CONFIRMATION MODAL
     ================================================================= */
  const bookingSuccess = document.getElementById('booking-success-message');
  const confClientName = document.getElementById('conf-client-name');
  const confClientPhone = document.getElementById('conf-client-phone');
  const confSummaryBox = document.getElementById('conf-summary-box');
  const bookAnotherBtn = document.getElementById('book-another-btn');

  if (bookingForm) {
    // Set min date to today
    const dateInput = document.getElementById('client-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check selected services
      const selectedSvcs = Array.from(serviceCheckboxes)
        .filter(c => c.checked)
        .map(c => c.value);

      if (selectedSvcs.length === 0) {
        alert('Please select at least one detailing service package.');
        return;
      }

      const clientName = document.getElementById('client-name').value.trim();
      const clientPhone = document.getElementById('client-phone').value.trim();
      const clientEmail = document.getElementById('client-email').value.trim();
      const clientDate = document.getElementById('client-date').value;
      const vehicleType = document.querySelector('input[name="vehicle-type"]:checked').value;
      const locationType = document.querySelector('input[name="location-type"]:checked').value;
      const totalAmount = liveTotalEl ? liveTotalEl.textContent : '$238';

      if (!clientName || !clientPhone || !clientEmail || !clientDate) {
        alert('Please complete all required fields (*)');
        return;
      }

      // Submit loading animation
      const submitBtn = document.getElementById('submit-booking-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <span class="spinner-inline"></span>
        <span>Securing Appointment...</span>
      `;
      submitBtn.disabled = true;

      setTimeout(() => {
        // Hide form, show confirmation
        bookingForm.classList.add('hidden');
        bookingSuccess.classList.remove('hidden');

        if (confClientName) confClientName.textContent = clientName;
        if (confClientPhone) confClientPhone.textContent = clientPhone;

        if (confSummaryBox) {
          confSummaryBox.innerHTML = `
            <div><strong>Vehicle:</strong> ${vehicleType}</div>
            <div><strong>Location:</strong> ${locationType}</div>
            <div><strong>Preferred Date:</strong> ${clientDate}</div>
            <div><strong>Packages Selected:</strong> ${selectedSvcs.join(', ')}</div>
            <div><strong>Estimated Total:</strong> <span style="color: var(--accent-cyan); font-weight:800; font-size:1.1rem;">${totalAmount}</span></div>
          `;
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Trigger celebratory specular shine
        if (glossSweep) {
          glossSweep.classList.add('trigger-sweep');
        }
      }, 900);
    });

    if (bookAnotherBtn) {
      bookAnotherBtn.addEventListener('click', () => {
        bookingForm.reset();
        bookingForm.classList.remove('hidden');
        bookingSuccess.classList.add('hidden');
        calculateEstimate();
      });
    }
  }


  /* =================================================================
     5. SYNTHESIZED DETAILING AUDIO ENGINE (WEB AUDIO API)
     ================================================================= */
  let audioCtx = null;
  let audioEnabled = false;
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIconMuted = document.getElementById('audio-icon-muted');
  const audioIconOn = document.getElementById('audio-icon-on');

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;

      if (audioEnabled) {
        audioToggleBtn.classList.add('active');
        audioIconMuted.classList.add('hidden');
        audioIconOn.classList.remove('hidden');
        showToast('Sensory Detailing Ambience: Enabled 💧✨');
        playSensorySound('water');
      } else {
        audioToggleBtn.classList.remove('active');
        audioIconMuted.classList.remove('hidden');
        audioIconOn.classList.add('hidden');
        showToast('Sensory Audio: Muted');
      }
    });
  }

  // Synthesizes natural water cascade & gentle towel buff sounds
  let lastAudioPlayTime = 0;
  function playSensorySound(type) {
    if (!audioEnabled || !audioCtx) return;
    const now = Date.now();
    if (now - lastAudioPlayTime < 350) return; // throttle
    lastAudioPlayTime = now;

    try {
      const ctx = audioCtx;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      if (type === 'water') {
        // Synthesize soft water spray with filtered pink/white noise
        const bufferSize = ctx.sampleRate * 0.4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        whiteNoise.start();

      } else if (type === 'towel') {
        // Synthesize smooth high-frequency microfiber polish shine
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.25);
        osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.45);

        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (err) {
      console.warn('Audio synthesis notice:', err);
    }
  }


  /* =================================================================
     6. MOBILE DRAWER NAVIGATION
     ================================================================= */
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) {
        mobileDrawer.classList.remove('open');
        mobileToggle.classList.remove('active');
      } else {
        mobileDrawer.classList.add('open');
        mobileToggle.classList.add('active');
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.classList.remove('active');
      });
    });
  }


  /* =================================================================
     7. TOAST NOTIFICATION UTILITY
     ================================================================= */
  function showToast(message) {
    let toast = document.getElementById('site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'site-toast';
      toast.style.cssText = `
        position: fixed;
        top: 96px;
        right: 24px;
        background: rgba(14, 20, 32, 0.95);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 210, 255, 0.4);
        box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0,210,255,0.25);
        color: #ffffff;
        font-family: var(--font-display);
        font-size: 0.88rem;
        font-weight: 600;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
    }, 2800);
  }

  // Update dynamic year in footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

});
