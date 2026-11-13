/* The demo's skeuomorphic icons, drawn by hand for the app's sidebar and the Home page (the rest of the app uses
   Lucide's line icons, icons.js). After the folder and file icons in kubilayss's project panel
   (x.com/kubilayss/status/2119903375781146759), in black and white (orange when on): each is a small object with a white-to-grey body,
   an outline darker at the bottom, a lighter layer behind, filled grey details and a soft shadow (styles.css, .sk).
   The gradients are defined once in index.html. Each is the inner shapes of a 24 × 24 icon, drawn by skeu(name):
   .sk-back is the layer behind, .sk-b the body, .sk-line an outline with no fill, .sk-g a filled detail and .sk-gs a
   stroked one. */
window.SKEU = {
  home:
    '<path class="sk-b" d="M4.6 10.4 11 5a1.6 1.6 0 0 1 2 0l6.4 5.4c.4.3.6.8.6 1.3v6.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6.8c0-.5.2-1 .6-1.3z"/>' +
    '<rect class="sk-g" x="10" y="14" width="4" height="6.5" rx="1.3"/>',
  target:
    '<circle class="sk-b" cx="12" cy="12.5" r="8.5"/>' +
    '<circle class="sk-gs" cx="12" cy="12.5" r="4.6"/>' +
    '<circle class="sk-g" cx="12" cy="12.5" r="1.8"/>',
  insights:
    '<rect class="sk-b" x="3.5" y="3.5" width="17" height="17" rx="4.5"/>' +
    '<rect class="sk-g" x="7.3" y="12" width="2.6" height="5" rx="1"/>' +
    '<rect class="sk-g" x="10.7" y="8.5" width="2.6" height="8.5" rx="1"/>' +
    '<rect class="sk-g" x="14.1" y="10.5" width="2.6" height="6.5" rx="1"/>',
  report:
    '<path class="sk-b" d="M7 3.5h7.3l4.7 4.7v10.3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/>' +
    '<path class="sk-line" d="M14 3.8V7.2a1 1 0 0 0 1 1h3.7"/>' +
    '<rect class="sk-g" x="8" y="11" width="8" height="1.7" rx=".85"/>' +
    '<rect class="sk-g" x="8" y="14.4" width="5.5" height="1.7" rx=".85"/>',
  help:
    '<circle class="sk-b" cx="12" cy="12.5" r="8.5"/>' +
    '<path class="sk-gs" d="M9.7 10.3a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.3"/>' +
    '<circle class="sk-g" cx="12" cy="17.1" r="1.15"/>',
  table:
    '<rect class="sk-b" x="3.5" y="4.5" width="17" height="15.5" rx="3.5"/>' +
    '<rect class="sk-g" x="6.5" y="7.5" width="11" height="2.2" rx="1.1"/>' +
    '<rect class="sk-g sk-g--soft" x="6.5" y="11.5" width="4.5" height="2" rx="1"/>' +
    '<rect class="sk-g sk-g--soft" x="12.5" y="11.5" width="5" height="2" rx="1"/>' +
    '<rect class="sk-g sk-g--soft" x="6.5" y="15" width="4.5" height="2" rx="1"/>' +
    '<rect class="sk-g sk-g--soft" x="12.5" y="15" width="5" height="2" rx="1"/>',
  people:
    '<circle class="sk-back" cx="15.6" cy="7.9" r="2.9"/>' +
    '<path class="sk-back" d="M11 19.5c0-3.1 2-5.3 4.6-5.3s4.6 2.2 4.6 5.3a1 1 0 0 1-1 1h-7.2a1 1 0 0 1-1-1z"/>' +
    '<circle class="sk-b" cx="9.4" cy="8.6" r="3.3"/>' +
    '<path class="sk-b" d="M3.8 19.3c0-3.5 2.5-5.9 5.6-5.9s5.6 2.4 5.6 5.9a1.2 1.2 0 0 1-1.2 1.2H5a1.2 1.2 0 0 1-1.2-1.2z"/>',
  sparkles:
    '<path class="sk-back" d="M18 3.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z"/>' +
    '<path class="sk-b" d="M10.5 5.5c.8 4.4 2.6 6.2 7 7-4.4.8-6.2 2.6-7 7-.8-4.4-2.6-6.2-7-7 4.4-.8 6.2-2.6 7-7z"/>',
  academy:
    '<path class="sk-back" d="M6.8 11.6v4.6c0 1.6 2.3 3 5.2 3s5.2-1.4 5.2-3v-4.6"/>' +
    '<path class="sk-b" d="M11.3 4.8a1.6 1.6 0 0 1 1.4 0l7.8 3.9c.6.3.6 1.1 0 1.4l-7.8 3.9a1.6 1.6 0 0 1-1.4 0L3.5 10.1c-.6-.3-.6-1.1 0-1.4z"/>' +
    '<path class="sk-gs" d="M20 9.6v4.9"/>' +
    '<circle class="sk-g" cx="20" cy="15.4" r="1.2"/>',
}
