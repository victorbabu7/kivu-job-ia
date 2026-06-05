//fac
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    btn.nextElementSibling.classList.toggle('open');
  });
});

//  Burger
const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
if (burger) burger.addEventListener('click', () => navMobile.classList.toggle('open'));

// Contact form 
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-send span');
    btn.textContent = '⏳ Envoi en cours...';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:   document.getElementById('senderEmail').value,
          phone:   document.getElementById('senderPhone').value,
          subject: document.getElementById('subject').value,
          message: document.getElementById('message').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      document.getElementById('formSuccess').classList.add('show');
      form.reset();
      btn.textContent = 'Envoyer le message';
    } catch (err) {
      alert('Erreur : ' + err.message);
      btn.textContent = 'Envoyer le message';
    }
  });
}

//Scroll animations 
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .step-v, .objectif-card, .contact-item, .faq-item').forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// ===== Navbar scroll shadow =====
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(0,0,0,0.1)' : 'none';
});

// ===== TABS CV =====
if (document.querySelector('.tab')) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ===== TABS OFFRE =====
if (document.querySelector('.tab-offre')) {
  document.querySelectorAll('.tab-offre').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-offre').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-offre-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.offre).classList.add('active');
    });
  });
}

// ===== DROPZONE CV =====
if (document.getElementById('dropzone')) {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName');

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      fileInput.files = e.dataTransfer.files;
      fileName.textContent = '✅ ' + file.name;
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) fileName.textContent = '✅ ' + fileInput.files[0].name;
  });
}

// ===== DROPZONE OFFRE =====
if (document.getElementById('dropzoneOffre')) {
  const dz = document.getElementById('dropzoneOffre');
  const fi = document.getElementById('fileOffre');
  const fn = document.getElementById('fileOffreName');

  dz.addEventListener('dragover', e => {
    e.preventDefault();
    dz.classList.add('drag-over');
  });

  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));

  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      fi.files = e.dataTransfer.files;
      fn.textContent = '✅ ' + file.name;
    }
  });

  fi.addEventListener('change', () => {
    if (fi.files[0]) fn.textContent = '✅ ' + fi.files[0].name;
  });
}


if (document.getElementById('btnAnalyse')) {
  document.getElementById('btnAnalyse').addEventListener('click', async () => {
    const cvText = document.getElementById('cvText')?.value.trim() || '';
    const fileInputCV = document.getElementById('fileInput');
    const offreText = document.getElementById('offreText')?.value.trim() || '';
    const fileInputOffre = document.getElementById('fileOffre');

    const hasCV = (fileInputCV && fileInputCV.files && fileInputCV.files.length > 0) || cvText;
    const hasOffre = (fileInputOffre && fileInputOffre.files && fileInputOffre.files.length > 0) || offreText;

    if (!hasCV) { alert('Veuillez fournir votre CV.'); return; }
    if (!hasOffre) { alert("Veuillez fournir l'offre d'emploi."); return; }

    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');

    try {
      const formData = new FormData();

      if (fileInputCV && fileInputCV.files && fileInputCV.files.length > 0) {
        formData.append('cvFile', fileInputCV.files[0]);
      } else {
        formData.append('cvText', cvText);
      }

      if (fileInputOffre && fileInputOffre.files && fileInputOffre.files.length > 0) {
        formData.append('offreFile', fileInputOffre.files[0]);
      } else {
        formData.append('offreText', offreText);
      }

      const res = await fetch('/api/extract',{
        method: 'POST',body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur extraction');

      sessionStorage.setItem('cv', data.cvText);
      sessionStorage.setItem('offre', data.offreText);
      window.location.href = 'resultats.html';
    } catch (err) {
      alert('Erreur : ' + err.message);
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoader) btnLoader.classList.add('hidden');
    }
  });
}

//  FOOTER GLOBAL
document.addEventListener('DOMContentLoaded', () => {
  const existingFooter = document.querySelector('footer.footer');
  if (!existingFooter) {
    const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="logo">💼 Kivu<span> Job IA</span></div>
            <p>La plateforme intelligente qui transforme votre recherche d'emploi en succès concret.</p>
            <p class="footer-sub">Propulsé par <a href="https://kivuculturehub.com" target="_blank">Kivu Culture Hub</a></p>
          </div>
          <div class="footer-links-col">
            <h4>Plateforme</h4>
            <ul>
              <li><a href="index.html#how">Comment ça marche</a></li>
              <li><a href="index.html#features">Fonctionnalités</a></li>
              <li><a href="analyse.html">Analyser mon CV</a></li>
            </ul>
          </div>
          <div class="footer-links-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:kivuculturehub@gmail.com">kivuculturehub@gmail.com</a></li>
              <li><a href="tel:+243972212629">+243 972 212 629</a></li>
              <li><a href="tel:+254118912352">+254 118 912 352</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2025 Kivu Job IA — Tous droits réservés.</p>
          <p>Fait avec ❤️ au Kivu</p>
        </div>
      </div>
    </footer>`;
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
});