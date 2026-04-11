window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 400);
  }
});

const prog = document.getElementById('scrollProgress');
const navEl = document.getElementById('nav');
const allSections = Array.from(document.querySelectorAll('section[id]'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));

function onScroll() {
  const sy = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  prog.style.width = (sy / maxScroll * 100) + '%';
  navEl.classList.toggle('scrolled', sy > 20);

  const viewMid = sy + window.innerHeight * 0.40;
  let active = allSections[0].id;
  for (const s of allSections) {
    if (s.offsetTop <= viewMid) active = s.id;
  }
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + active));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.card, .project-card, .contact-card').forEach(el => io.observe(el));

const skillIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const cards = entry.target.querySelectorAll('.skill-card');
      cards.forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 55));
      skillIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });
document.querySelectorAll('.skills-icon-grid').forEach(g => skillIo.observe(g));

const hamburger = document.getElementById('hamburger');
const mobileNavMenu = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNavMenu.classList.toggle('mobile-active');
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();

    // Close mobile menu on click
    if (hamburger && mobileNavMenu) {
      hamburger.classList.remove('active');
      mobileNavMenu.classList.remove('mobile-active');
    }

    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});

const container = document.getElementById('heroParticles');
const colors = ['rgba(0,122,255,0.16)', 'rgba(175,82,222,0.13)', 'rgba(52,199,89,0.13)', 'rgba(255,159,10,0.13)', 'rgba(255,55,95,0.11)'];
for (let i = 0; i < 20; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = Math.random() * 12 + 5;
  p.style.cssText = `width:${size}px;height:${size}px;background:${colors[i % colors.length]};left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dur:${(Math.random() * 3 + 3).toFixed(1)}s;--delay:${(Math.random() * 4).toFixed(1)}s;`;
  container.appendChild(p);
}

document.querySelectorAll('.skill-card, .project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const sc = card.classList.contains('skill-card') ? 1.08 : 1.01;
    card.style.transform = `translateY(-5px) scale(${sc}) rotateX(${-y * 9}deg) rotateY(${x * 9}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

const discordId = "902241075316535366";
let lanyardHeartbeat = null;

function connectLanyard() {
  const ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.op === 1) {
      const interval = msg.d.heartbeat_interval;
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
      if (lanyardHeartbeat) clearInterval(lanyardHeartbeat);
      lanyardHeartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 3 }));
        }
      }, interval);
    }

    if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
      updateDiscordStatus(msg.d);
    }
  };

  ws.onclose = () => {
    if (lanyardHeartbeat) clearInterval(lanyardHeartbeat);
    setTimeout(connectLanyard, 5000);
  };

  ws.onerror = () => {
    ws.close();
  };
}

connectLanyard();

function updateDiscordStatus(d) {
  if (!d) return;

  const lyAvatar = document.getElementById('ly-avatar');
  const lyStatus = document.getElementById('ly-status');
  const lyName = document.getElementById('ly-name');
  const lyActivity = document.getElementById('ly-activity');
  if (!lyAvatar) return;

  const avatarHash = d.discord_user.avatar;
  if (avatarHash) {
    lyAvatar.src = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`;
  }
  lyName.textContent = d.discord_user.global_name || d.discord_user.username;

  lyStatus.className = 'ly-status-dot ' + d.discord_status;
  try {
    let hasActivity = false;

    if (d.listening_to_spotify && d.spotify) {
      lyActivity.innerHTML = `🎧 ${d.spotify.song} - ${d.spotify.artist}`;
      hasActivity = true;
    } else if (d.activities && d.activities.length > 0) {
      const customStatus = d.activities.find(a => a.type === 4);
      const playing = d.activities.find(a => a.type === 0);
      const coding = d.activities.find(a => a.name?.includes("Visual Studio Code") || a.name?.includes("IntelliJ") || a.name?.includes("Code"));
      const streaming = d.activities.find(a => a.type === 1);
      const watching = d.activities.find(a => a.type === 3);

      if (coding) {
        lyActivity.innerHTML = `🧑‍💻 Kodluyor: ${coding.details || coding.state || coding.name}`;
        hasActivity = true;
      } else if (streaming) {
        lyActivity.innerHTML = `📡 Yayında: ${streaming.details || streaming.name}`;
        hasActivity = true;
      } else if (playing) {
        lyActivity.innerHTML = `🎮 Oynuyor: ${playing.name}`;
        hasActivity = true;
      } else if (watching) {
        lyActivity.innerHTML = `📺 İzliyor: ${watching.name}`;
        hasActivity = true;
      } else if (customStatus && customStatus.state) {
        const emoji = customStatus.emoji ? customStatus.emoji.name : '💬';
        lyActivity.innerHTML = `${emoji} ${customStatus.state}`;
        hasActivity = true;
      }
    }

    lyActivity.style.display = hasActivity ? '' : 'none';
  } catch (e) {
    lyActivity.style.display = 'none';
  }
}
/* ── LOCALIZATION (i18n) ── */
const translations = {
  tr: {
    nav_about: "Hakkımda",
    nav_skills: "Yetenekler",
    nav_projects: "Projeler",
    nav_testimonials: "Referanslar",
    nav_contact: "İletişim",
    ly_loading: "Yükleniyor...",
    ly_search: "Discord durumu aranıyor",
    hero_hi: "Merhaba, ben<br><span class=\"accent\">wulnrydev</span>",
    hero_sub: "Modern arayüzler, gelişmiş uygulamalar, <span class=\"accent\">Minecraft çözümleri</span> ve Discord botları tasarlıyor & geliştiriyorum.",
    hero_contact: "İletişime Geç →",
    about_title: "Oyundan koda uzanan bir yolculuk",
    about_story_1_title: "Başlangıç — Minecraft",
    about_story_1_desc: "Başlarda Minecraft sunucularında aktif bir oyuncuydum. Kendi sunucumu kurmak isteğiyle yazılım dünyasına adım attım.",
    about_story_2_title: "İlk Adımlar — Plugin Geliştirme",
    about_story_2_desc: "Spigot/Paper API ile Java öğrenerek Minecraft eklentileri yazmaya başladım. Bu süreç programlamaya olan tutkumu ateşledi.",
    about_story_3_title: "Büyüme — Full Stack",
    about_story_3_desc: "Web teknolojilerine geçiş yaparak React, Node.js ve veritabanı sistemlerini öğrendim. 3+ yıldır aktif çalışıyorum.",
    about_story_4_title: "Günümüz — Vibe Coding",
    about_story_4_desc: "Son dönemde vibe coding akımına ilgi duyuyor, modern araçlarla yaratıcı projeler geliştirmeye devam ediyorum.",
    about_exp: "Deneyim",
    about_exp_y: "Yıl Deneyim",
    about_exp_t: "Teknoloji",
    about_exp_l: "Öğrenme",
    about_focus: "Odak Alanları",
    about_focus_desc: "Full-stack web geliştirme, Minecraft plugin geliştirme, açık kaynak katkıları ve vibe coding. Performans odaklı ve ölçeklenebilir çözümler üretiyorum.",
    skills_desc: "Kullandığım teknolojiler ve araçlar",
    cat_db: "Veritabanı",
    cat_game: "Oyun & Discord",
    proj_desc: "GitHub'da paylaştığım açık kaynak projelerim",
    proj_1_desc: "Minecraft sunucuları için yüksek performanslı ve modern sohbet yönetim eklentisi.",
    proj_2_desc: "HaxEm Studio için geliştirdiğim Discord botu. Sunucu yönetimini kolaylaştıran pratik komutlarla donatılmış.",
    proj_3_desc: "Minecraft sunucuları için chunk bazlı block limitleyici. Performans odaklı mimari ile sunucu sağlığını korur.",
    test_desc: "Birlikte çalıştığım kişilerin ve sunucuların düşünceleri",
    test_1_role: "Sunucu Sahibi",
    test_1_desc: "Oyun sunucumun websitesi çok yavaştı, yaptığı optimizasyon işlemlerinden sonra site çok hızlandı ve daha modern oldu.",
    test_2_role: "Sunucu Sahibi",
    test_2_desc: "Minecraft sunucum için profesyonel olarak eklentiler geliştirdi ve bize tam kontrol sağladı.",
    test_3_role: "Proje Yöneticisi",
    test_3_desc: "Discord botumuzdaki yaşanan çökmeleri ve gecikmeleri anında tespit edip çözdü. İşinde gerçekten uzman.",
    test_4_role: "Geliştirici",
    test_4_desc: "Açık kaynak projesini kendi sistemimize entegre etmemizde çok yardımcı oldu. Tertemiz bir kod yapısı var.",
    test_5_role: "Topluluk Yöneticisi",
    test_5_desc: "Performans sorunları yaşadığımız eklentiyi baştan yazarak lagı tamamen yok etti. Gönül rahatlığıyla çalışabilirsiniz.",
    contact_title: "Birlikte çalışalım",
    contact_sub: "Bir proje fikrin varsa, iş teklifin varsa ya da sadece merhaba demek istiyorsan — her zaman buradayım.",
    contact_btn_email: "E-posta Gönder",
    contact_btn: "Discord'dan Ulaş"
  },
  en: {
    nav_about: "About",
    nav_skills: "Skills",
    nav_projects: "Projects",
    nav_testimonials: "Testimonials",
    nav_contact: "Contact",
    ly_loading: "Loading...",
    ly_search: "Searching Discord...",
    hero_hi: "Hi, I'm<br><span class=\"accent\">wulnrydev</span>",
    hero_sub: "I design & develop modern interfaces, advanced applications, <span class=\"accent\">Minecraft solutions</span> and Discord bots.",
    hero_contact: "Get In Touch →",
    about_title: "A journey from gaming to code",
    about_story_1_title: "Beginning — Minecraft",
    about_story_1_desc: "Initially, I was an active player on Minecraft servers. I stepped into the software world with the goal of running my own server.",
    about_story_2_title: "First Steps — Plugin Dev",
    about_story_2_desc: "I started writing Minecraft plugins by learning Java using the Spigot/Paper API. This ignited my passion for programming.",
    about_story_3_title: "Growth — Full Stack",
    about_story_3_desc: "Transitioning to web technologies, I learned React, Node.js, and database systems. Actively coding for 3+ years.",
    about_story_4_title: "Present — Vibe Coding",
    about_story_4_desc: "Lately, I'm interested in the vibe coding movement, continuing to build creative projects with modern tools.",
    about_exp: "Experience",
    about_exp_y: "Years Exp.",
    about_exp_t: "Technologies",
    about_exp_l: "Learning",
    about_focus: "Focus Areas",
    about_focus_desc: "Full-stack web development, Minecraft plugin development, open-source contributions, and vibe coding. I build performance-driven and scalable solutions.",
    skills_desc: "Technologies and tools I use",
    cat_db: "Database",
    cat_game: "Gaming & Discord",
    proj_desc: "My open source projects shared on GitHub",
    proj_1_desc: "High-performance and modern chat management plugin for Minecraft servers.",
    proj_2_desc: "Discord bot developed for HaxEm Studio. Equipped with practical commands that simplify server management.",
    proj_3_desc: "Chunk-based block limiter for Minecraft servers. Protects server health with a performance-oriented architecture.",
    test_desc: "Thoughts from the people and servers I've worked with",
    test_1_role: "Server Owner",
    test_1_desc: "My game server's website was very slow, it became much faster and modern after his optimizations.",
    test_2_role: "Server Owner",
    test_2_desc: "Developed professional plugins for my Minecraft server and gave us full control.",
    test_3_role: "Project Manager",
    test_3_desc: "He instantly identified and resolved crashes and delays in our Discord bot. A true expert.",
    test_4_role: "Developer",
    test_4_desc: "Helped us immensely in integrating an open-source project into our system. Has a very clean code structure.",
    test_5_role: "Community Manager",
    test_5_desc: "Rewrote the plugin we had performance issues with and completely eliminated the lag. Highly recommended.",
    contact_title: "Let's work together",
    contact_sub: "If you have a project idea, a business proposal, or just want to say hi — I'm always here.",
    contact_btn_email: "Send Email",
    contact_btn: "Reach out on Discord"
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';

function applyTranslations(lang) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => el.classList.add('lang-fading'));

  setTimeout(() => {
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    document.querySelectorAll('.lang-toggle span').forEach(span => {
      if (span.getAttribute('data-lang') === lang) {
        span.classList.add('active');
      } else {
        span.classList.remove('active');
      }
    });

    const lyNameEl = document.getElementById('ly-name');
    const lyActivityEl = document.getElementById('ly-activity');
    if (lyNameEl && lyNameEl.textContent === 'Yükleniyor...' && lang === 'en') {
      lyNameEl.textContent = translations.en.ly_loading;
    }
    if (lyActivityEl && lyActivityEl.textContent === 'Discord durumu aranıyor' && lang === 'en') {
      lyActivityEl.textContent = translations.en.ly_search;
    }


    elements.forEach(el => el.classList.remove('lang-fading'));
  }, 250);
}

document.querySelectorAll('.lang-toggle').forEach(toggles => {
  toggles.querySelectorAll('span').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('span[data-lang]');
      if (!target) return;
      const selectedLang = target.getAttribute('data-lang');
      if (selectedLang && selectedLang !== currentLang) {
        currentLang = selectedLang;
        localStorage.setItem('lang', currentLang);
        applyTranslations(currentLang);
      }
    });
  });
});

window.addEventListener('load', () => {
  if (currentLang !== 'tr') {
    applyTranslations(currentLang);
  }
});
