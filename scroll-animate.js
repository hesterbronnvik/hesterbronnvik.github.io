<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Select all text elements to animate
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);  // Animate once only
        }
      });
    }, { threshold: 0.1 });

    textElements.forEach(el => observer.observe(el));
  });
</script>

