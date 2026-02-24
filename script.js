let photos = [];
let config = { layout: 'strip', filter: 'none', lang: 'en' };

const i18n = {
    en: { start: "START SESSION", layout: "Select Style", step1: "Layout", step2: "Snap", step3: "Design", frame: "Frame Color", save: "Save & Finish", discard: "Discard" },
    kh: { start: "ចាប់ផ្តើម", layout: "ជ្រើសរើសម៉ូត", step1: "ម៉ូត", step2: "ថតរូប", step3: "រចនា", frame: "ពណ៌ស៊ុម", save: "រក្សាទុក", discard: "បោះបង់" }
};

function setLang(l) {
    config.lang = l;
    document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('active', b.id === `btn-${l}`));
    document.getElementById('btn-start').innerText = i18n[l].start;
    document.getElementById('title-layout').innerText = i18n[l].layout;
    document.getElementById('lbl-step1').innerText = i18n[l].step1;
    document.getElementById('lbl-step2').innerText = i18n[l].step2;
    document.getElementById('lbl-step3').innerText = i18n[l].step3;
    document.getElementById('title-frame').innerText = i18n[l].frame;
    document.getElementById('btn-save').innerText = i18n[l].save;
    document.getElementById('btn-discard').innerText = i18n[l].discard;
}

document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelector('.sun-path').classList.toggle('hidden', isDark);
    document.querySelector('.moon-path').classList.toggle('hidden', !isDark);
};

function updateSteps(n) {
    document.getElementById('progress-bar').classList.toggle('hidden', n === 0);
    document.querySelectorAll('.step-box').forEach((box, i) => box.classList.toggle('active', i + 1 <= n));
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startApp() {
    updateSteps(1);
    showView('view-layout');
}

async function selectLayout(type) {
    config.layout = type;
    updateSteps(2);
    showView('view-camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('video').srcObject = stream;
}

function setFilter(f) {
    config.filter = f;
    document.getElementById('video').style.filter = f;
    document.querySelectorAll('.f-pill').forEach(btn => {
        if(btn.getAttribute('onclick').includes(f)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function runCapture() {
    photos = [];
    document.getElementById('shutter').classList.add('hidden');
    autoSnap();
}

function autoSnap() {
    if (photos.length === 4) {
        renderEditor();
        return;
    }
    let timer = 3;
    const cd = document.getElementById('countdown');
    cd.innerText = timer;
    cd.classList.remove('hidden');

    const interval = setInterval(() => {
        timer--;
        cd.innerText = timer;
        if (timer === 0) {
            clearInterval(interval);
            cd.classList.add('hidden');
            flash();
            takePhoto();
            document.getElementById('count-num').innerText = photos.length;
            setTimeout(autoSnap, 1000);
        }
    }, 1000);
}

function flash() {
    const f = document.getElementById('flash');
    f.style.opacity = 1;
    setTimeout(() => f.style.opacity = 0, 100);
}

function takePhoto() {
    const v = document.getElementById('video');
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    ctx.filter = config.filter;
    // Mirror the capture to match the video preview
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    photos.push(c.toDataURL());
}

function renderEditor() {
    updateSteps(3);
    showView('view-editor');
    const inner = document.getElementById('strip-inner');
    inner.innerHTML = '';
    inner.className = (config.layout === 'grid') ? 'grid-mode' : 'strip-mode';
    photos.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        inner.appendChild(img);
    });
}

function changeColor(c) {
    document.getElementById('final-strip').style.backgroundColor = c;
}

function finishSession() {
    const gallery = JSON.parse(localStorage.getItem('foto_gallery') || '[]');
    gallery.unshift(photos[0]);
    localStorage.setItem('foto_gallery', JSON.stringify(gallery.slice(0, 15)));
    location.reload();
}

function finishSession() {
    const btn = document.getElementById('btn-save');
    const originalText = btn.innerText;
    btn.innerText = "Generating PNG...";
    btn.disabled = true;

    // Small delay to let the UI update
    setTimeout(() => {
        generateDownload();
        
        // Save to Spotlight gallery
        const gallery = JSON.parse(localStorage.getItem('foto_gallery') || '[]');
        gallery.unshift(photos[0]);
        localStorage.setItem('foto_gallery', JSON.stringify(gallery.slice(0, 15)));

        btn.innerText = "Downloaded!";
        setTimeout(() => location.reload(), 1500);
    }, 500);
}

function generateDownload() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Configuration for the final file
    const imgW = 600; 
    const imgH = 450;
    const padding = 40;
    const gap = 20;
    const footerH = 80;

    if (config.layout === 'strip') {
        canvas.width = imgW + (padding * 2);
        canvas.height = (imgH * 4) + (padding * 2) + (gap * 3) + footerH;
    } else {
        canvas.width = (imgW * 2) + (padding * 2) + gap;
        canvas.height = (imgH * 2) + (padding * 2) + gap + footerH;
    }

    // 1. Draw Background (Frame Color)
    ctx.fillStyle = document.getElementById('final-strip').style.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Photos
    photos.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        
        let x, y;
        if (config.layout === 'strip') {
            x = padding;
            y = padding + (i * (imgH + gap));
        } else {
            x = padding + ((i % 2) * (imgW + gap));
            y = padding + (Math.floor(i / 2) * (imgH + gap));
        }
        
        // We use a sync-like approach here since the images are DataURLs
        ctx.drawImage(img, x, y, imgW, imgH);
    });

    // 3. Draw Branding Text
    ctx.fillStyle = (ctx.fillStyle === "#111111" || ctx.fillStyle === "rgb(17, 17, 17)") ? "#ffffff" : "#111111";
    ctx.font = "900 30px Inter";
    ctx.textAlign = "center";
    ctx.fillText("FOTO. — 2026", canvas.width / 2, canvas.height - 40);

    // 4. Trigger Download
    const link = document.createElement('a');
    link.download = `FOTO_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}