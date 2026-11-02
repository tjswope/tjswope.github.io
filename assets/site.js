// New Wave Apps — shared site behavior
(function () {
    document.documentElement.classList.remove('no-js');

    // Mobile nav
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (header && toggle) {
        toggle.addEventListener('click', function () {
            var open = header.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        header.querySelectorAll('.nav a').forEach(function (a) {
            a.addEventListener('click', function () {
                header.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Year
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    // Reveal on scroll
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
    }

    // App filter chips
    var chips = document.querySelectorAll('.chip[data-filter]');
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var f = chip.getAttribute('data-filter');
            chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
            document.querySelectorAll('.app-track .app-card[data-cat]').forEach(function (card) {
                card.hidden = !(f === 'all' || card.getAttribute('data-cat').split(' ').indexOf(f) !== -1);
            });
            var track = document.querySelector('.app-track');
            if (track) track.scrollTo({ left: 0 });
        });
    });

    // Carousels (screenshot gallery, app cards) + lightbox
    document.querySelectorAll('.gallery-wrap, .carousel').forEach(function (wrap) {
        var track = wrap.querySelector('.gallery, .app-track');
        var prev = wrap.querySelector('[data-dir="-1"]');
        var next = wrap.querySelector('[data-dir="1"]');
        [prev, next].forEach(function (b) {
            if (!b) return;
            b.addEventListener('click', function () {
                track.scrollBy({ left: parseInt(b.getAttribute('data-dir'), 10) * track.clientWidth * 0.7, behavior: 'smooth' });
            });
        });
    });
    var lb = document.querySelector('.lightbox');
    if (lb && typeof lb.showModal === 'function') {
        var lbImg = lb.querySelector('img');
        document.querySelectorAll('.gallery button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var img = btn.querySelector('img');
                lbImg.src = img.src;
                lbImg.alt = img.alt;
                lb.showModal();
            });
        });
        lb.addEventListener('click', function () { lb.close(); });
    }

    // Contact form
    var form = document.querySelector('form.contact-form');
    if (form) {
        var status = form.querySelector('.form-status');
        var submit = form.querySelector('button[type="submit"]');
        var appSelect = form.querySelector('select[name="app"]');

        // Preselect app from ?app=slug
        var params = new URLSearchParams(window.location.search);
        var preset = params.get('app');
        if (preset && appSelect) {
            for (var i = 0; i < appSelect.options.length; i++) {
                if (appSelect.options[i].value === preset) { appSelect.selectedIndex = i; break; }
            }
        }

        function show(kind, html) {
            status.className = 'form-status ' + kind;
            status.innerHTML = html;
        }

        function mailtoFallback(data) {
            var subject = 'Website message' + (data.app ? ' – ' + data.app : '');
            var body = data.message + '\n\n— ' + data.name + ' (' + data.email + ')';
            return 'mailto:support@newwaveapps.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }

            var fd = new FormData(form);
            var data = {};
            fd.forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
            if (appSelect && appSelect.selectedIndex > 0) data.app = appSelect.options[appSelect.selectedIndex].text;

            submit.disabled = true;
            var label = submit.textContent;
            submit.textContent = 'Sending…';

            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (json) {
                    if (!res.ok) throw new Error(json.error || 'Request failed');
                    return json;
                });
            }).then(function () {
                form.reset();
                show('ok', '<strong>Thanks — your message is on its way.</strong> We’ll get back to you as soon as we can.');
            }).catch(function (err) {
                show('err', 'Sorry, your message couldn’t be sent' + (err && err.message && err.message !== 'Request failed' ? ' (' + err.message + ')' : '') +
                    '. You can <a href="' + mailtoFallback(data) + '">email us directly</a> instead.');
            }).finally(function () {
                submit.disabled = false;
                submit.textContent = label;
            });
        });
    }
})();
