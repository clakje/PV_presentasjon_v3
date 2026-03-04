// app.js - Hovedlogikk for prosjektet

document.addEventListener('DOMContentLoaded', () => {
    const layer1 = document.getElementById('layer-1-background');
    const layer2 = document.getElementById('layer-2-graphics');
    const layer3 = document.getElementById('layer-3-content');
    const progressBar = document.getElementById('progress-bar');

    let slideData = [];

    // 1. Hent innholdet fra innhold.json
    fetch('data/innhold.json')
        .then(response => response.json())
        .then(data => {
            slideData = data.slides;
            byggDOM(slideData);
            initScrollObserving();
            initSpinnerScroll();
        })
        .catch(error => console.error('Feil ved lasting av innhold:', error));

    // 2. Bygg HTML for presentasjonen basert på innhold.json
    function byggDOM(slides) {
        slides.forEach((slide, index) => {
            // Opprett en container for hver slide
            const section = document.createElement('section');
            section.classList.add('slide');
            section.dataset.index = index; // Lagrer hvilken slide dette er vha data-attributt
            section.id = slide.id;

            // Opprett innholdsboksen (teksten) for Lag 3
            const contentBox = document.createElement('div');
            contentBox.classList.add('slide-content');
            contentBox.innerHTML = slide.innhold_html;

            // Hvis sliden ber om mørkt tema for teksten, legg til en klasse
            if (slide.tekst_tema === "mork") {
                section.classList.add('dark-mode');
            }

            section.appendChild(contentBox);
            layer3.appendChild(section);
        });
    }

    // 3. Sett opp Intersection Observer for å overvåke når brukeren scroller
    function initScrollObserving() {
        const observerOptions = {
            root: null, // Bruk viewporten
            rootMargin: '0px',
            threshold: 0.5 // Slår ut når 50% av sliden er synlig
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Elementet er nå synlig på skjermen
                    entry.target.classList.add('is-visible');

                    // Finne ut hvilken data som hører til denne sliden
                    const slideIndex = entry.target.dataset.index;
                    const data = slideData[slideIndex];

                    oppdaterLagUnder(data);
                } else {
                    // Elementet har forlatt skjermen. Fjerner klassen slik at animasjonen reverseres (f.eks når man scroller opp igjen).
                    entry.target.classList.remove('is-visible');
                }
            });
        }, observerOptions);

        // Begynn å observere alle seksjonene
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => observer.observe(slide));
    }

    // 4. Oppdater Lag 1 (Bakgrunn) og Lag 2 (Grafikk) dynamisk
    function oppdaterLagUnder(data) {
        // Oppdater Lag 1: Bakgrunnsfarge
        if (data.bakgrunnsfarge) {
            layer1.style.backgroundColor = data.bakgrunnsfarge;
        }

        // Oppdater Lag 2: Grafikk
        // Sjekk om det finnes grafikk for denne sliden
        if (data.grafikk_url) {
            // Hvis det er et bilde, bytt innholdet i Lag 2
            layer2.innerHTML = `<img src="assets/images/${data.grafikk_url}" alt="Grafikk">`;
            layer2.style.opacity = 1;

            // Plasser grafikken (venstre, midt, høyre)
            if (data.grafikk_posisjon === "venstre") {
                layer2.style.justifyContent = "flex-start";
            } else if (data.grafikk_posisjon === "hoyre") {
                layer2.style.justifyContent = "flex-end";
            } else {
                layer2.style.justifyContent = "center";
            }
        } else {
            // Fade ut Lag 2 hvis det ikke er noe bilde på denne sliden
            layer2.style.opacity = 0;
            setTimeout(() => { layer2.innerHTML = ''; }, 800); // Vent til fade-out er ferdig
        }
    }

    // 5. Oppdater fremdriftsindikatoren ved rulling
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;

        // Regn ut prosentandel
        const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // 6. Scroll-basert spinning-logikk for strek-overgang fra side 3 til 4
    function initSpinnerScroll() {
        const kompetanseSlide = document.getElementById('kompetanse');
        const fordypningSlide = document.getElementById('fordypning');

        if (!kompetanseSlide || !fordypningSlide) return;

        window.addEventListener('scroll', () => {
            const spinner = document.getElementById('the-spinner');
            if (!spinner) return;

            const rect = kompetanseSlide.getBoundingClientRect();
            const slideHeight = rect.height;
            const viewportHeight = window.innerHeight;

            // Beregn hvor langt gjennom slide 3 brukeren har scrollet
            // rect.top er negativ når brukeren har scrollet forbi toppen av sliden
            const scrolledPast = -rect.top;
            const progress = scrolledPast / slideHeight;

            // Når brukeren er forbi 40% av slide 3 og slide 4 ikke er fullt synlig
            const fordypningRect = fordypningSlide.getBoundingClientRect();
            const fordypningVisible = fordypningRect.top < viewportHeight * 0.5;

            if (fordypningVisible) {
                spinner.classList.remove('is-spinning');
                spinner.classList.add('extend-down');
            } else if (progress > 0.4) {
                spinner.classList.remove('extend-down');
                spinner.classList.add('is-spinning');
            } else {
                spinner.classList.remove('is-spinning', 'extend-down');
            }
        });
    }
});
